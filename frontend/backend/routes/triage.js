const express = require('express');
const router = express.Router();
const TriageResult = require('../models/TriageResult');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');

// ─── GET /api/triage/:patientId/latest ───────────────────────────────────
router.get('/:patientId/latest', protect, async (req, res) => {
    const triage = await TriageResult.findOne({
        patient: req.params.patientId,
        isActive: true,
    })
        .populate('triggeredBy', 'firstName lastName role')
        .populate('doctorOverride.overriddenBy', 'firstName lastName');

    if (!triage) {
        return res.status(404).json({ success: false, message: 'No active triage found.' });
    }
    res.json({ success: true, data: triage });
});

// ─── GET /api/triage/:patientId/history ──────────────────────────────────
router.get('/:patientId/history', protect, authorize('doctor', 'admin', 'patient'), async (req, res) => {
    const history = await TriageResult.find({ patient: req.params.patientId })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('triggeredBy', 'firstName lastName role')
        .populate('doctorOverride.overriddenBy', 'firstName lastName')
        .populate('symptomLog');

    res.json({ success: true, data: history, count: history.length });
});

module.exports = router;
