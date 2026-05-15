const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');

// ─── GET /api/reminders ───────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    let patientId;

    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        patientId = patient._id;
    } else if (req.query.patientId) {
        patientId = req.query.patientId;
    }

    const filter = patientId ? { patient: patientId } : {};
    const { status } = req.query;
    if (status) filter.status = status;

    const reminders = await Reminder.find(filter).sort({ scheduledAt: 1 });
    res.json({ success: true, data: reminders });
});

// ─── POST /api/reminders ──────────────────────────────────────────────────
router.post('/', protect, audit('CREATE_REMINDER', 'Reminder'), async (req, res) => {
    const {
        title,
        description,
        type,
        scheduledAt,
        location,
        doctorName,
        isRecurring,
        recurrenceRule,
        patientId,
        medicationName,
        medicationDose,
        medicationInstructions,
    } = req.body;

    let targetPatientId = patientId;
    let patientRecord = null;

    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        targetPatientId = patient._id;
        patientRecord = patient;
    }

    if (!targetPatientId) {
        return res.status(400).json({ success: false, message: 'patientId is required.' });
    }

    if (type === 'medication') {
        const trimmedName = (medicationName || '').trim();
        if (!trimmedName) {
            return res.status(400).json({ success: false, message: 'Medication name is required for medication reminders.' });
        }

        if (!patientRecord) {
            patientRecord = await Patient.findById(targetPatientId);
        }

        if (!patientRecord) {
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        const medList = (patientRecord.medications || []).map((m) => m.toLowerCase());
        if (!medList.includes(trimmedName.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Medication not found in patient profile. Add it in Profile first.'
            });
        }
    }

    const resolvedTitle = (title || '').trim()
        || (type === 'medication' && (medicationName || '').trim() ? `Take ${medicationName.trim()}` : '');

    if (!resolvedTitle) {
        return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    const reminder = await Reminder.create({
        patient: targetPatientId,
        createdBy: req.user._id,
        title: resolvedTitle,
        description,
        type,
        scheduledAt,
        location,
        doctorName,
        isRecurring,
        recurrenceRule,
        medicationName: type === 'medication' ? medicationName?.trim() : undefined,
        medicationDose: type === 'medication' ? medicationDose : undefined,
        medicationInstructions: type === 'medication' ? medicationInstructions : undefined,
    });

    res.status(201).json({ success: true, data: reminder });
});

// ─── PATCH /api/reminders/:id ─────────────────────────────────────────────
router.patch('/:id', protect, async (req, res) => {
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, data: reminder });
});

// ─── DELETE /api/reminders/:id ────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found.' });
    res.json({ success: true, message: 'Reminder deleted.' });
});

module.exports = router;
