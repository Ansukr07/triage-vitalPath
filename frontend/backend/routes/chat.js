const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const { handleChat, generateConversationSummary } = require('../services/llmService');
const ChatSession    = require('../models/ChatSession');
const EscalationLog  = require('../models/EscalationLog');
const User           = require('../models/User');
const { detectEmergency }                        = require('../services/emergencyDetectionService');
const { sendEmergencyAlert }                     = require('../services/telegramAlertService');
const { scorePhysicalSeverity, scoreMentalSeverity } = require('../services/clinicalBertService');
const { scoreToSeverity }                        = require('../services/triageEngine');

// ─────────────────────────────────────────────────────────────────────────────
// Session Management
// ─────────────────────────────────────────────────────────────────────────────

router.get('/sessions', protect, async (req, res) => {
    const sessions = await ChatSession.find({ user: req.user.id })
        .sort({ updatedAt: -1 })
        .lean();
    res.json({ success: true, data: sessions });
});

router.post('/sessions', protect, async (req, res) => {
    const { title, messages = [] } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
    const session = await ChatSession.create({ user: req.user.id, title, messages });
    res.status(201).json({ success: true, data: session });
});

router.put('/sessions/:id', protect, async (req, res) => {
    const session = await ChatSession.findOne({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    if (req.body.title    !== undefined) session.title    = req.body.title;
    if (Array.isArray(req.body.messages)) session.messages = req.body.messages;
    
    // ── Update risk scores if provided ──
    if (typeof req.body.latestPhysicalRiskScore === 'number') session.latestPhysicalRiskScore = req.body.latestPhysicalRiskScore;
    if (typeof req.body.latestMentalRiskScore   === 'number') session.latestMentalRiskScore   = req.body.latestMentalRiskScore;
    if (req.body.latestPhysicalSeverity) session.latestPhysicalSeverity = req.body.latestPhysicalSeverity;
    if (req.body.latestMentalSeverity)   session.latestMentalSeverity   = req.body.latestMentalSeverity;
    if (Array.isArray(req.body.latestPhysicalReasons)) session.latestPhysicalReasons = req.body.latestPhysicalReasons;
    if (Array.isArray(req.body.latestMentalReasons))   session.latestMentalReasons   = req.body.latestMentalReasons;
    if (req.body.latestCareCategory) session.latestCareCategory = req.body.latestCareCategory;
    if (req.body.latestEmergency)    session.latestEmergency    = req.body.latestEmergency;

    await session.save();
    res.json({ success: true, data: session });
});

router.delete('/sessions/:id', protect, async (req, res) => {
    const session = await ChatSession.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!session) return res.status(404).json({ success: false, message: 'Session not found.' });
    res.json({ success: true, message: 'Session deleted.' });
});

router.post('/sessions/auto-save', protect, async (req, res) => {
    const { messages = [] } = req.body;
    if (!messages || messages.length === 0) {
        return res.status(400).json({ success: false, message: 'No messages to save.' });
    }
    try {
        const normalised = messages.map(m => ({
            role:    m.role === 'model' ? 'assistant' : (m.role || 'user'),
            content: m.content || m.parts?.[0]?.text || '',
        })).filter(m => m.content);

        if (normalised.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid messages to save.' });
        }

        const title   = await generateConversationSummary(messages);
        const session = await ChatSession.create({
            user:     req.user.id,
            title:    title || 'Voice Consultation',
            type:     'voice',
            messages: normalised,
            // ── Save risk metadata if provided ──
            latestPhysicalRiskScore: req.body.latestPhysicalRiskScore || 0,
            latestMentalRiskScore:   req.body.latestMentalRiskScore   || 0,
            latestPhysicalSeverity:  req.body.latestPhysicalSeverity,
            latestMentalSeverity:    req.body.latestMentalSeverity,
            latestPhysicalReasons:   req.body.latestPhysicalReasons,
            latestMentalReasons:     req.body.latestMentalReasons,
            latestCareCategory:      req.body.latestCareCategory,
            latestEmergency:         req.body.latestEmergency,
        });
        res.status(201).json({ success: true, data: session });
    } catch (err) {
        console.error('[Chat Session] Auto-save failed:', err);
        res.status(500).json({ success: false, message: 'Failed to auto-save session.' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// Escalation History
// ─────────────────────────────────────────────────────────────────────────────

router.get('/escalations', protect, async (req, res) => {
    const logs = await EscalationLog.find({})
        .sort({ createdAt: -1 })
        .populate('user', 'firstName lastName email')
        .lean();
    res.json({ success: true, data: logs });
});

router.post('/escalations/:id/acknowledge', protect, async (req, res) => {
    const log = await EscalationLog.findById(req.params.id);
    if (!log) return res.status(404).json({ success: false, message: 'Escalation not found.' });
    log.acknowledged    = true;
    log.acknowledgedBy  = req.user.id;
    log.acknowledgedAt  = new Date();
    log.acknowledgeNote = req.body.note || '';
    await log.save();
    res.json({ success: true, data: log });
});

// ─────────────────────────────────────────────────────────────────────────────
// LLM Message Handler — Conversational Only (no triage scoring)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/chat
 * @desc    Send a message to the VitalPath AI Assistant (reply only)
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
    const { message, history, mode } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    console.log(`[Chat Route] Incoming: user=${req.user.id} (${mode || 'text'}) "${message.substring(0, 60)}"`);

    let llmResponse;
    try {
        llmResponse = await handleChat(history, message, mode || 'text');
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }

    return res.json({
        success: true,
        data: {
            reply: llmResponse.reply,
            role: 'model',
        },
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// On-Demand Clinical Risk Assessment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /api/chat/assess-risk
 * @desc    Run full dual-domain clinical risk assessment on conversation history
 * @access  Private
 */
router.post('/assess-risk', protect, async (req, res) => {
    const { history, location } = req.body;

    if (!history || history.length === 0) {
        return res.status(400).json({ success: false, message: 'Conversation history is required.' });
    }

    console.log(`[Assess Risk] Triggered by user=${req.user.id}`);

    // Build full conversation text for analysis
    const fullHistory  = Array.isArray(history)
        ? history.map(m => m?.parts?.[0]?.text || m?.content || '').join(' ')
        : '';
    const analysisText = fullHistory.slice(0, 2000);
    const lastMessage  = history[history.length - 1]?.parts?.[0]?.text ||
                         history[history.length - 1]?.content || '';

    // ── 1. Run dual BERT scoring in parallel ────────────────────────────────
    const [physicalBert, mentalBert] = await Promise.all([
        scorePhysicalSeverity(analysisText),
        scoreMentalSeverity(analysisText),
    ]);

    // ── 2. Score blending (pure BERT on manual trigger) ─────────────────────
    const physicalRiskScore = Math.min(100, Math.max(0, Math.round(physicalBert.bertScore)));
    const mentalRiskScore   = Math.min(100, Math.max(0, Math.round(mentalBert.bertScore)));
    const riskScore         = Math.max(physicalRiskScore, mentalRiskScore);

    const physicalSeverity = scoreToSeverity(physicalRiskScore);
    const mentalSeverity   = scoreToSeverity(mentalRiskScore);
    const physicalReasons  = physicalBert.reasons?.slice(0, 4) || [];
    const mentalReasons    = mentalBert.reasons?.slice(0, 4)   || [];

    let careCategory = 'Home Care';
    if (riskScore >= 75) careCategory = 'Emergency Room';
    else if (riskScore > 20) careCategory = 'Clinic Visit';

    console.log(`[Assess Risk] p=${physicalRiskScore} m=${mentalRiskScore} → ${careCategory}`);

    // ── 3. Emergency detection ───────────────────────────────────────────────
    const emergencyResult = detectEmergency({
        message:          lastMessage,
        fullHistory,
        physicalRiskScore,
        mentalRiskScore,
        riskScore,
    });

    // ── 4. Escalation workflow ───────────────────────────────────────────────
    let escalation = null;
    if (emergencyResult.isEmergency) {
        const user = await User.findById(req.user.id).lean();
        const conversationSummary = history.slice(-6)
            .map(m => {
                const role = m?.role === 'user' ? 'Patient' : 'Assistant';
                const text = m?.parts?.[0]?.text || m?.content || '';
                return `${role}: ${text}`;
            }).join('\n');

        const alertData = {
            patient:             { name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), id: req.user.id },
            emergencyType:       emergencyResult.type,
            emergencyCategory:   emergencyResult.emergencyType,
            severity:            emergencyResult.severity,
            reason:              emergencyResult.reason,
            symptoms:            emergencyResult.detectedSymptoms,
            conversationSummary: conversationSummary.slice(0, 600),
            location:            location || null,
            physicalRiskScore,
            mentalRiskScore,
            riskScore,
            timestamp:           new Date().toISOString(),
        };

        const telegramResult = await sendEmergencyAlert(alertData).catch(err => {
            console.error('[Assess Risk] Telegram alert failed:', err.message);
            return { success: false, error: err.message };
        });

        try {
            const logEntry = await EscalationLog.create({
                user:                req.user.id,
                emergencyType:       emergencyResult.type,
                severity:            emergencyResult.severity,
                reason:              emergencyResult.reason,
                detectedSymptoms:    emergencyResult.detectedSymptoms,
                telegramAlertSent:   telegramResult.success,
                telegramMessageId:   telegramResult.messageId,
                telegramError:       telegramResult.error,
                conversationSummary: alertData.conversationSummary,
                location:            location || undefined,
            });
            escalation = logEntry;
        } catch (dbErr) {
            console.error('[Assess Risk] Failed to log escalation:', dbErr.message);
        }
    }

    // ── 5. Persist Triage Result ─────────────────────────────────────────────
    if (req.user.role === 'patient') {
        try {
            const Patient      = require('../models/Patient');
            const TriageResult = require('../models/TriageResult');
            const patient      = await Patient.findOne({ user: req.user.id });

            if (patient) {
                let priority = 'stable';
                if (careCategory === 'Emergency Room') priority = 'critical';
                else if (careCategory === 'Clinic Visit') priority = 'high';

                const triage = await TriageResult.create({
                    patient:        patient._id,
                    triggeredBy:    req.user.id,
                    finalPriority:  priority,
                    finalScore:     riskScore,
                    physicalRiskScore, mentalRiskScore,
                    physicalSeverity, mentalSeverity,
                    physicalReasons, mentalReasons,
                    prioritySource: 'ml_model',
                    isActive:       true,
                    vitalsSnapshot: { note: 'On-demand clinical assessment' },
                });

                await Patient.findByIdAndUpdate(patient._id, {
                    triageStatus: priority,
                    lastTriageAt: new Date(),
                });

                await TriageResult.updateMany(
                    { patient: patient._id, _id: { $ne: triage._id } },
                    { isActive: false }
                );

                console.log(`[Assess Risk] ✅ Triage saved. ID=${triage._id}`);
            }
        } catch (err) {
            console.error('[Assess Risk] DB sync failed:', err.message);
        }
    }

    return res.json({
        success: true,
        data: {
            physicalRiskScore, mentalRiskScore,
            physicalSeverity,  mentalSeverity,
            physicalReasons,   mentalReasons,
            riskScore, careCategory,
            emergency: emergencyResult.isEmergency ? {
                isEmergency:      emergencyResult.isEmergency,
                emergencyType:    emergencyResult.emergencyType,
                type:             emergencyResult.type,
                severity:         emergencyResult.severity,
                reason:           emergencyResult.reason,
                detectedSymptoms: emergencyResult.detectedSymptoms,
                escalationId:     escalation?._id || null,
            } : null,
        },
    });
});

module.exports = router;
