const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Symptom = require('../models/Symptom');
const TriageResult = require('../models/TriageResult');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { runTriageEngine, mergePriorities } = require('../services/triageEngine');
const { getMLRiskScore, buildMLFeatures } = require('../services/mlService');
const { getClinicalEmbeddings } = require('../services/clinicalBertService');
const { sendEmergencyAlert } = require('../services/telegramAlertService');

// ─── POST /api/patients/emergency-alert ────────────────────────────────────
router.post('/emergency-alert', protect, authorize('patient'), async (req, res) => {
    const patientProfile = await Patient.findOne({ user: req.user._id }).populate('user', 'firstName lastName phone');
    if (!patientProfile) {
        return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }

    const alertData = {
        patient: {
            name: `${patientProfile.user.firstName} ${patientProfile.user.lastName}`,
            id: patientProfile._id.toString(),
            phone: patientProfile.user.phone
        },
        emergencyType: 'critical',
        severity: 'critical',
        reason: 'Patient actively triggered emergency SOS button.',
        symptoms: ['User initiated SOS / Immediate Assistance Requested'],
        conversationSummary: 'Manual trigger from Patient Dashboard.',
        timestamp: new Date().toISOString()
    };

    const telegramResult = await sendEmergencyAlert(alertData);

    if (telegramResult.success) {
        res.json({ success: true, message: 'Emergency alert sent successfully to Telegram.' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to send Telegram alert', error: telegramResult.error });
    }
});

// ─── GET /api/patients/me ─────────────────────────────────────────────────
router.get('/me', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id })
        .populate('user', 'firstName lastName email phone')
        .populate('assignedDoctors', 'user specializations');

    if (!patient) {
        return res.status(404).json({ success: false, message: 'Patient profile not found.' });
    }
    res.json({ success: true, data: patient });
});

// ─── PATCH /api/patients/me ───────────────────────────────────────────────
router.patch('/me', protect, authorize('patient'), audit('UPDATE_PATIENT_PROFILE', 'Patient'), async (req, res) => {
    const {
        dateOfBirth, gender, bloodType, allergies, conditions, medications,
        emergencyContact, address, latestVitals,
    } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found.' });

    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (bloodType) patient.bloodType = bloodType;
    if (allergies) patient.allergies = allergies;
    if (conditions) patient.conditions = conditions;
    if (medications) patient.medications = medications;
    if (emergencyContact) patient.emergencyContact = { ...patient.emergencyContact, ...emergencyContact };
    if (address) patient.address = { ...patient.address, ...address };

    if (latestVitals) {
        patient.latestVitals = { ...latestVitals, recordedAt: new Date() };
        patient.vitalHistory.push(patient.latestVitals);
        if (patient.vitalHistory.length > 50) patient.vitalHistory.shift(); // keep last 50
    }

    await patient.save();
    res.json({ success: true, message: 'Profile updated.', data: patient });
});

// ─── POST /api/patients/symptoms ─────────────────────────────────────────
// Submit symptom log + trigger triage
router.post('/symptoms', protect, authorize('patient'), audit('SUBMIT_SYMPTOMS', 'Symptom'), async (req, res) => {
    const { symptoms, additionalNotes, currentVitals } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one symptom is required.' });
    }

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Normalize duration to days
    const processedSymptoms = symptoms.map((s) => ({
        ...s,
        durationDays: parseDurationToDays(s.duration),
    }));

    // Generate ClinicalBERT embeddings for symptoms
    const symptomText = processedSymptoms.map(s => `${s.name}: ${s.notes || ''}`).join('. ') + '. ' + (additionalNotes || '');
    const { embeddings } = await getClinicalEmbeddings(symptomText);

    // Save symptom log
    const symptomLog = await Symptom.create({
        patient: patient._id,
        submittedBy: req.user._id,
        symptoms: processedSymptoms,
        additionalNotes,
        currentVitals,
        clinicalEmbeddings: embeddings || []
    });

    // Use current vitals (submitted) or patient's latest vitals
    const vitals = currentVitals || patient.latestVitals || {};

    // Run rule-based triage
    const ruleResult = runTriageEngine(vitals, processedSymptoms);

    // Run ML scoring (may return { available: false })
    const mlFeatures = buildMLFeatures(vitals, processedSymptoms);
    const mlResult = await getMLRiskScore(mlFeatures);

    // Merge
    const { finalPriority, finalScore, source } = mergePriorities(ruleResult, mlResult);

    // Save triage result
    const triage = await TriageResult.create({
        patient: patient._id,
        symptomLog: symptomLog._id,
        triggeredBy: req.user._id,
        ruleEngine: {
            priority: ruleResult.priority,
            score: ruleResult.score,
            reasoning: ruleResult.reasoning,
            triggeredRules: ruleResult.triggeredRules,
        },
        mlModel: mlResult,
        finalPriority,
        finalScore,
        prioritySource: source,
        vitalsSnapshot: vitals,
    });

    // Update patient triage status
    await Patient.findByIdAndUpdate(patient._id, {
        triageStatus: finalPriority,
        lastTriageAt: new Date(),
    });

    // Mark previous triage as inactive
    await TriageResult.updateMany(
        { patient: patient._id, _id: { $ne: triage._id } },
        { isActive: false }
    );

    res.status(201).json({
        success: true,
        message: 'Symptoms submitted and triage completed.',
        data: {
            symptomLogId: symptomLog._id,
            triage: {
                finalPriority,
                finalScore,
                source,
                ruleEngine: ruleResult,
                mlAvailable: mlResult.available,
                explanation: buildExplanation(finalPriority, ruleResult.reasoning),
            },
        },
    });
});

// ─── GET /api/patients/symptoms ──────────────────────────────────────────
router.get('/symptoms', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const logs = await Symptom.find({ patient: patient._id })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json({ success: true, data: logs });
});

// ─── POST /api/patients/clinical-insights ────────────────────────────────
// Live ClinicalBERT extraction (Live Insights)
router.post('/clinical-insights', protect, authorize('patient'), async (req, res) => {
    const { text } = req.body;
    if (!text || text.length < 5) {
        return res.json({ success: true, symptoms: [], medications: [] });
    }

    const { extractEntities } = require('../services/clinicalBertService');
    const result = await extractEntities(text);

    res.json({
        success: true,
        data: {
            symptoms: result.symptoms || [],
            medications: result.medications || [],
            tests: result.tests || []
        }
    });
});

// ─── GET /api/patients/triage/history ─────────────────────────────────────
router.get('/triage/history', protect, authorize('patient'), async (req, res) => {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const history = await TriageResult.find({ patient: patient._id })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('triggeredBy', 'firstName lastName role')
        .populate('symptomLog');

    res.json({ success: true, data: history });
});

// ─── Helpers ──────────────────────────────────────────────────────────────
function parseDurationToDays(duration) {
    if (!duration) return null;
    const match = duration.match(/(\d+(?:\.\d+)?)\s*(hour|day|week|month|year)/i);
    if (!match) return null;
    const [, num, unit] = match;
    const n = parseFloat(num);
    const map = { hour: 1 / 24, day: 1, week: 7, month: 30, year: 365 };
    return Math.round(n * (map[unit.toLowerCase()] || 1));
}

function buildExplanation(priority, reasoning) {
    const urgencyMap = {
        stable: 'Your current indicators are within acceptable ranges. Continue monitoring.',
        moderate: 'Some values need attention. Please schedule a consultation soon.',
        high: 'Several indicators suggest you should seek medical attention promptly.',
        critical: 'Urgent: Multiple critical indicators detected. Please seek immediate medical attention.',
    };
    return {
        level: priority,
        message: urgencyMap[priority],
        factors: reasoning.slice(0, 5).map((r) => r.factor),
        disclaimer: 'This is a decision-support assessment only. A licensed doctor must evaluate your condition.',
    };
}

module.exports = router;
