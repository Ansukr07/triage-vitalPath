/**
 * EHR Route — /api/ehr
 * Aggregates patient health data from all models into a unified Electronic Health Record.
 * No data duplication — reads from existing collections.
 */
const express = require('express');
const router = express.Router();

const Patient = require('../models/Patient');
const TriageResult = require('../models/TriageResult');
const MedicalReport = require('../models/MedicalReport');
const ChatSession = require('../models/ChatSession');
const EscalationLog = require('../models/EscalationLog');
const Symptom = require('../models/Symptom');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { generateHealthReport } = require('../services/llmService');

// ─── Helpers ──────────────────────────────────────────────────────────────

function riskLevelFromScore(score) {
    if (score >= 75) return 'critical';
    if (score >= 51) return 'high';
    if (score >= 21) return 'moderate';
    return 'stable';
}

/**
 * Build a unified timeline of health events for a patient.
 * Returns sorted array of { type, date, title, summary, priority, data }
 */
async function buildTimeline(patientId, userId, limit = 100) {
    const events = [];

    // Triage sessions
    const triages = await TriageResult.find({ patient: patientId })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('symptomLog')
        .lean();

    for (const t of triages) {
        events.push({
            type: 'triage',
            date: t.createdAt,
            title: `Triage Assessment — ${t.finalPriority?.toUpperCase()}`,
            summary: `Risk score: ${t.finalScore ?? 'N/A'} · Source: ${t.prioritySource ?? 'rule engine'}`,
            priority: t.finalPriority,
            data: {
                finalPriority: t.finalPriority,
                finalScore: t.finalScore,
                symptoms: t.symptomLog?.symptoms?.map(s => s.name) || [],
                reasoning: t.ruleEngine?.reasoning?.slice(0, 3) || [],
                doctorOverride: t.doctorOverride || null,
            },
            _id: t._id,
        });
    }

    // Medical reports
    const reports = await MedicalReport.find({ patient: patientId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

    for (const r of reports) {
        events.push({
            type: 'report',
            date: r.reportDate || r.createdAt,
            title: `${formatReportType(r.reportType)} Uploaded`,
            summary: r.parsedData?.summary || 'AI parsing pending',
            priority: null,
            data: {
                reportId: r._id,
                reportType: r.reportType,
                fileName: r.originalName,
                parseStatus: r.parsedData?.parseStatus,
                flaggedItems: r.parsedData?.flaggedItems || [],
                bertDocType: r.bertClassification?.docType,
            },
            _id: r._id,
        });
    }

    // Chat / AI Assistant sessions
    const chats = await ChatSession.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(30)
        .lean();

    for (const c of chats) {
        events.push({
            type: c.hadEmergency ? 'emergency' : 'chat',
            date: c.createdAt,
            title: c.hadEmergency ? `⚠️ Emergency: ${c.title}` : `AI Session: ${c.title}`,
            summary: c.aiSummary || `${c.messages?.length || 0} messages · Risk: ${c.riskLevel || 'stable'}`,
            priority: c.riskLevel || 'stable',
            data: {
                sessionId: c._id,
                riskScore: c.riskScore,
                riskLevel: c.riskLevel,
                symptoms: c.extractedSymptoms || [],
                messageCount: c.messages?.length || 0,
                hadEmergency: c.hadEmergency,
                type: c.type,
            },
            _id: c._id,
        });
    }

    // Emergency escalations
    const escalations = await EscalationLog.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();

    for (const e of escalations) {
        events.push({
            type: 'emergency',
            date: e.createdAt,
            title: `Emergency Alert — ${e.emergencyType?.toUpperCase()}`,
            summary: e.reason,
            priority: 'critical',
            data: {
                emergencyType: e.emergencyType,
                severity: e.severity,
                riskScore: e.riskScore,
                telegramSent: e.telegramAlertSent,
                acknowledged: e.acknowledged,
                symptoms: e.detectedSymptoms || [],
            },
            _id: e._id,
        });
    }

    // Doctor notes added at patient level
    const patient = await Patient.findById(patientId)
        .populate('doctorNotes.addedBy', 'firstName lastName role')
        .lean();

    for (const n of (patient?.doctorNotes || [])) {
        events.push({
            type: 'doctor_note',
            date: n.createdAt,
            title: `Doctor Note — ${n.category?.toUpperCase()}`,
            summary: n.text,
            priority: null,
            data: {
                noteId: n._id,
                category: n.category,
                addedBy: n.addedBy,
                role: n.role,
                isPrivate: n.isPrivate,
            },
            _id: n._id,
        });
    }

    // Sort all events by date descending
    events.sort((a, b) => new Date(b.date) - new Date(a.date));
    return events.slice(0, limit);
}

function formatReportType(type) {
    const map = {
        blood_test: 'Blood Test',
        xray: 'X-Ray',
        mri: 'MRI',
        ct_scan: 'CT Scan',
        ecg: 'ECG',
        urine_test: 'Urine Test',
        biopsy: 'Biopsy',
        prescription: 'Prescription',
        discharge_summary: 'Discharge Summary',
        other: 'Medical Report',
    };
    return map[type] || 'Report';
}

// ─── PATIENT ROUTES ────────────────────────────────────────────────────────

/**
 * GET /api/ehr/me
 * Full EHR for the authenticated patient
 */
router.get('/me', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id })
        .populate('user', 'firstName lastName email phone createdAt')
        .populate('assignedDoctors')
        .populate('doctorNotes.addedBy', 'firstName lastName role')
        .lean();

    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const [triageCount, reportCount, chatCount, escalationCount, latestTriage] = await Promise.all([
        TriageResult.countDocuments({ patient: patient._id }),
        MedicalReport.countDocuments({ patient: patient._id, isDeleted: false }),
        ChatSession.countDocuments({ user: req.user._id }),
        EscalationLog.countDocuments({ user: req.user._id }),
        TriageResult.findOne({ patient: patient._id, isActive: true })
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    res.json({
        success: true,
        data: {
            profile: patient,
            stats: {
                totalTriageSessions: triageCount,
                totalReports: reportCount,
                totalChatSessions: chatCount,
                totalEmergencies: escalationCount,
                currentRisk: patient.triageStatus || 'unknown',
                lastTriageAt: patient.lastTriageAt,
            },
            latestTriage,
        },
    });
});

/**
 * GET /api/ehr/timeline
 * Chronological health events for the patient
 */
router.get('/timeline', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id }).lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const timeline = await buildTimeline(patient._id, req.user._id, limit);

    res.json({ success: true, data: timeline, total: timeline.length });
});

/**
 * GET /api/ehr/risk-trend
 * Risk score history for charting
 */
router.get('/risk-trend', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id }).lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const days = parseInt(req.query.days) || 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const triages = await TriageResult.find({
        patient: patient._id,
        createdAt: { $gte: since },
    })
        .sort({ createdAt: 1 })
        .select('finalScore finalPriority createdAt prioritySource')
        .lean();

    const chatRisks = await ChatSession.find({
        user: req.user._id,
        createdAt: { $gte: since },
        riskScore: { $gt: 0 },
    })
        .sort({ createdAt: 1 })
        .select('riskScore riskLevel createdAt title')
        .lean();

    // Merge and sort
    const points = [
        ...triages.map(t => ({
            date: t.createdAt,
            score: t.finalScore || 0,
            level: t.finalPriority,
            source: 'triage',
            label: `Triage: ${t.finalPriority}`,
        })),
        ...chatRisks.map(c => ({
            date: c.createdAt,
            score: c.riskScore || 0,
            level: c.riskLevel,
            source: 'chat',
            label: c.title,
        })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Statistics
    const scores = points.map(p => p.score).filter(Boolean);
    const stats = scores.length
        ? {
              avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              max: Math.max(...scores),
              min: Math.min(...scores),
              trend: scores.length >= 2
                  ? scores[scores.length - 1] > scores[0] ? 'worsening' : 'improving'
                  : 'stable',
          }
        : { avg: 0, max: 0, min: 0, trend: 'stable' };

    res.json({ success: true, data: { points, stats, days } });
});

/**
 * GET /api/ehr/summary
 * AI-generated health summary using existing llmService.generateHealthReport()
 */
router.get('/summary', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id })
        .populate('user', 'firstName lastName')
        .lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Gather data for LLM
    const [symptoms, reports, triageHistory, chatSessions] = await Promise.all([
        Symptom.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5).lean(),
        MedicalReport.find({ patient: patient._id, isDeleted: false }).sort({ createdAt: -1 }).limit(3).lean(),
        TriageResult.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5).lean(),
        ChatSession.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(3).select('title aiSummary riskScore riskLevel').lean(),
    ]);

    const payload = {
        name: `${patient.user?.firstName} ${patient.user?.lastName}`,
        age: patient.dateOfBirth
            ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
            : null,
        gender: patient.gender,
        bloodType: patient.bloodType,
        conditions: patient.conditions || [],
        medications: patient.medications || [],
        allergies: patient.allergies || [],
        surgeries: patient.surgeries || [],
        emergencyContact: patient.emergencyContact || {},
        latestVitals: patient.latestVitals || {},
        vitalHistory: (patient.vitalHistory || []).slice(-5),
        symptoms,
        reports,
        triageHistory,
        chatSummaries: chatSessions.map(c => c.aiSummary || c.title),
    };

    try {
        const summary = await generateHealthReport(payload);
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate summary.', error: err.message });
    }
});

/**
 * GET /api/ehr/search
 * Search across EHR records: symptoms, reports, triage, notes
 */
router.get('/search', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id }).lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const { q = '', type = 'all', riskLevel, dateFrom, dateTo, page = 1, limit = 20 } = req.query;

    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    const hasDate = Object.keys(dateFilter).length > 0;

    const results = [];

    if (type === 'all' || type === 'reports') {
        const reportQuery = { patient: patient._id, isDeleted: false };
        if (q) reportQuery.$or = [
            { originalName: { $regex: q, $options: 'i' } },
            { 'parsedData.summary': { $regex: q, $options: 'i' } },
            { 'parsedData.diagnosis': { $regex: q, $options: 'i' } },
            { reportType: { $regex: q, $options: 'i' } },
        ];
        if (hasDate) reportQuery.createdAt = dateFilter;

        const reports = await MedicalReport.find(reportQuery).sort({ createdAt: -1 }).limit(10).lean();
        results.push(...reports.map(r => ({ type: 'report', ...r })));
    }

    if (type === 'all' || type === 'triage') {
        const triageQuery = { patient: patient._id };
        if (riskLevel) triageQuery.finalPriority = riskLevel;
        if (hasDate) triageQuery.createdAt = dateFilter;

        const triages = await TriageResult.find(triageQuery)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('symptomLog')
            .lean();

        const filtered = q
            ? triages.filter(t =>
                  t.symptomLog?.symptoms?.some(s =>
                      s.name?.toLowerCase().includes(q.toLowerCase())
                  )
              )
            : triages;

        results.push(...filtered.map(t => ({ type: 'triage', ...t })));
    }

    if (type === 'all' || type === 'chat') {
        const chatQuery = { user: req.user._id };
        if (q) chatQuery.title = { $regex: q, $options: 'i' };
        if (riskLevel) chatQuery.riskLevel = riskLevel;
        if (hasDate) chatQuery.createdAt = dateFilter;

        const chats = await ChatSession.find(chatQuery).sort({ createdAt: -1 }).limit(10).lean();
        results.push(...chats.map(c => ({ type: 'chat', ...c })));
    }

    // Sort all by date
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const start = (page - 1) * limit;
    res.json({
        success: true,
        data: results.slice(start, start + parseInt(limit)),
        total: results.length,
        page: parseInt(page),
    });
});

// ─── DOCTOR / ADMIN ROUTES ─────────────────────────────────────────────────

/**
 * GET /api/ehr/patients/:id
 * Full EHR for a specific patient (doctor/admin view)
 */
router.get('/patients/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.id)
        .populate('user', 'firstName lastName email phone createdAt')
        .populate('assignedDoctors')
        .populate('doctorNotes.addedBy', 'firstName lastName role')
        .lean();

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const [triageCount, reportCount, chatCount, escalationCount, latestTriage] = await Promise.all([
        TriageResult.countDocuments({ patient: patient._id }),
        MedicalReport.countDocuments({ patient: patient._id, isDeleted: false }),
        ChatSession.countDocuments({ user: patient.user._id }),
        EscalationLog.countDocuments({ user: patient.user._id }),
        TriageResult.findOne({ patient: patient._id, isActive: true }).sort({ createdAt: -1 }).lean(),
    ]);

    res.json({
        success: true,
        data: {
            profile: patient,
            stats: {
                totalTriageSessions: triageCount,
                totalReports: reportCount,
                totalChatSessions: chatCount,
                totalEmergencies: escalationCount,
                currentRisk: patient.triageStatus || 'unknown',
                lastTriageAt: patient.lastTriageAt,
            },
            latestTriage,
        },
    });
});

/**
 * GET /api/ehr/patients/:id/timeline
 * Timeline for a patient (doctor/admin view)
 */
router.get('/patients/:id/timeline', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const timeline = await buildTimeline(patient._id, patient.user, limit);

    res.json({ success: true, data: timeline, total: timeline.length });
});

/**
 * GET /api/ehr/patients/:id/risk-trend
 * Risk trend for a patient (doctor/admin view)
 */
router.get('/patients/:id/risk-trend', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.id).lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const days = parseInt(req.query.days) || 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [triages, chatRisks] = await Promise.all([
        TriageResult.find({ patient: patient._id, createdAt: { $gte: since } })
            .sort({ createdAt: 1 })
            .select('finalScore finalPriority createdAt')
            .lean(),
        ChatSession.find({ user: patient.user, createdAt: { $gte: since }, riskScore: { $gt: 0 } })
            .sort({ createdAt: 1 })
            .select('riskScore riskLevel createdAt title')
            .lean(),
    ]);

    const points = [
        ...triages.map(t => ({ date: t.createdAt, score: t.finalScore || 0, level: t.finalPriority, source: 'triage' })),
        ...chatRisks.map(c => ({ date: c.createdAt, score: c.riskScore || 0, level: c.riskLevel, source: 'chat', label: c.title })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    const scores = points.map(p => p.score).filter(Boolean);
    const stats = scores.length
        ? {
              avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
              max: Math.max(...scores),
              min: Math.min(...scores),
              trend: scores.length >= 2
                  ? scores[scores.length - 1] > scores[0] ? 'worsening' : 'improving'
                  : 'stable',
          }
        : { avg: 0, max: 0, min: 0, trend: 'stable' };

    res.json({ success: true, data: { points, stats, days } });
});

/**
 * GET /api/ehr/patients/:id/summary
 * AI health summary for a patient (doctor view)
 */
router.get('/patients/:id/summary', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.id)
        .populate('user', 'firstName lastName')
        .lean();
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const [symptoms, reports, triageHistory, chatSessions] = await Promise.all([
        Symptom.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5).lean(),
        MedicalReport.find({ patient: patient._id, isDeleted: false }).sort({ createdAt: -1 }).limit(3).lean(),
        TriageResult.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5).lean(),
        ChatSession.find({ user: patient.user._id }).sort({ createdAt: -1 }).limit(3).select('title aiSummary riskScore riskLevel').lean(),
    ]);

    const payload = {
        name: `${patient.user?.firstName} ${patient.user?.lastName}`,
        age: patient.dateOfBirth
            ? Math.floor((Date.now() - new Date(patient.dateOfBirth)) / (365.25 * 24 * 3600 * 1000))
            : null,
        gender: patient.gender,
        bloodType: patient.bloodType,
        conditions: patient.conditions || [],
        medications: patient.medications || [],
        allergies: patient.allergies || [],
        latestVitals: patient.latestVitals || {},
        vitalHistory: (patient.vitalHistory || []).slice(-5),
        symptoms,
        reports,
        triageHistory,
        chatSummaries: chatSessions.map(c => c.aiSummary || c.title),
    };

    try {
        const summary = await generateHealthReport(payload);
        res.json({ success: true, data: summary });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to generate summary.', error: err.message });
    }
});

/**
 * POST /api/ehr/patients/:id/notes
 * Add a doctor/admin note to a patient record
 */
router.post(
    '/patients/:id/notes',
    protect,
    authorize('doctor', 'admin'),
    audit('ADD_DOCTOR_NOTE', 'Patient'),
    async (req, res) => {
        const { text, category = 'general', isPrivate = false } = req.body;
        if (!text?.trim()) return res.status(400).json({ success: false, message: 'Note text is required.' });

        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        const note = {
            text: text.trim(),
            addedBy: req.user._id,
            role: req.user.role,
            category,
            isPrivate,
        };

        patient.doctorNotes.push(note);
        await patient.save();

        const populated = await Patient.findById(req.params.id)
            .populate('doctorNotes.addedBy', 'firstName lastName role')
            .lean();

        const addedNote = populated.doctorNotes[populated.doctorNotes.length - 1];

        res.status(201).json({ success: true, message: 'Note added.', data: addedNote });
    }
);

/**
 * DELETE /api/ehr/patients/:id/notes/:noteId
 * Remove a doctor/admin note
 */
router.delete(
    '/patients/:id/notes/:noteId',
    protect,
    authorize('doctor', 'admin'),
    audit('DELETE_DOCTOR_NOTE', 'Patient'),
    async (req, res) => {
        const patient = await Patient.findById(req.params.id);
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        const noteIndex = patient.doctorNotes.findIndex(
            n => n._id.toString() === req.params.noteId
        );
        if (noteIndex === -1) return res.status(404).json({ success: false, message: 'Note not found.' });

        // Only the author or admin can delete
        const note = patient.doctorNotes[noteIndex];
        if (note.addedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this note.' });
        }

        patient.doctorNotes.splice(noteIndex, 1);
        await patient.save();

        res.json({ success: true, message: 'Note deleted.' });
    }
);

/**
 * PATCH /api/ehr/me/surgeries
 * Add/update surgery record for authenticated patient
 */
router.patch('/me/surgeries', protect, authorize('patient'), audit('UPDATE_SURGERIES', 'Patient'), async (req, res) => {
    const { surgeries } = req.body;
    if (!Array.isArray(surgeries)) return res.status(400).json({ success: false, message: 'surgeries must be an array.' });

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    patient.surgeries = surgeries;
    await patient.save();

    res.json({ success: true, message: 'Surgery records updated.', data: patient.surgeries });
});

/**
 * PATCH /api/ehr/me/insurance
 * Update insurance info for authenticated patient
 */
router.patch('/me/insurance', protect, authorize('patient'), audit('UPDATE_INSURANCE', 'Patient'), async (req, res) => {
    const { insuranceInfo } = req.body;
    if (!insuranceInfo) return res.status(400).json({ success: false, message: 'insuranceInfo is required.' });

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    patient.insuranceInfo = { ...patient.insuranceInfo, ...insuranceInfo };
    patient.occupation = req.body.occupation ?? patient.occupation;
    await patient.save();

    res.json({ success: true, message: 'Insurance info updated.', data: patient.insuranceInfo });
});

module.exports = router;
