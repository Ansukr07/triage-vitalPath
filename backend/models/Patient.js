const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
    {
        bloodPressureSystolic: { type: Number },   // mmHg
        bloodPressureDiastolic: { type: Number },   // mmHg
        heartRate: { type: Number },   // bpm
        temperature: { type: Number },   // Celsius
        oxygenSaturation: { type: Number },   // %
        respiratoryRate: { type: Number },   // breaths/min
        bloodGlucose: { type: Number },   // mg/dL
        weight: { type: Number },   // kg
        height: { type: Number },   // cm
        recordedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

// ─── Surgery Record ────────────────────────────────────────────────────────
const surgerySchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        date: { type: Date },
        hospital: { type: String },
        surgeon: { type: String },
        notes: { type: String },
    },
    { _id: true, timestamps: true }
);

// ─── Patient-level Doctor/Admin Note ─────────────────────────────────────
const patientNoteSchema = new mongoose.Schema(
    {
        text: { type: String, required: true },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['doctor', 'admin'], required: true },
        category: {
            type: String,
            enum: ['general', 'diagnosis', 'treatment', 'followup', 'alert'],
            default: 'general',
        },
        isPrivate: { type: Boolean, default: false }, // if true, patient cannot see it
    },
    { _id: true, timestamps: true }
);

const patientSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
        bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] },
        allergies: [{ type: String }],
        conditions: [{ type: String }],     // existing known conditions (entered by patient)
        medications: [{ type: String }],     // current medications (entered by patient)
        emergencyContact: {
            name: { type: String },
            relationship: { type: String },
            phone: { type: String },
        },
        address: {
            line1: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String, default: 'India' },
            pincode: { type: String },
        },

        // ─── EHR Extensions ───────────────────────────────────────────────
        occupation: { type: String },
        surgeries: [surgerySchema],
        insuranceInfo: {
            provider: { type: String },
            policyNumber: { type: String },
            expiryDate: { type: Date },
            coverageType: { type: String },
        },
        // Doctor / admin notes at patient level (separate from per-report notes)
        doctorNotes: [patientNoteSchema],

        // ─── Vitals ───────────────────────────────────────────────────────
        latestVitals: vitalSchema,
        vitalHistory: [vitalSchema],

        // ─── Relationships ────────────────────────────────────────────────
        assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
        triageStatus: {
            type: String,
            enum: ['stable', 'moderate', 'high', 'critical', 'unknown'],
            default: 'unknown',
        },
        lastTriageAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
