const mongoose = require('mongoose');

const reasoningItemSchema = new mongoose.Schema(
    {
        factor:       { type: String },
        value:        { type: String },
        threshold:    { type: String },
        contribution: { type: String },
        source:       { type: String, enum: ['rule_engine', 'ml_model', 'doctor_override'] },
    },
    { _id: false }
);

const triageResultSchema = new mongoose.Schema(
    {
        patient:     { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        symptomLog:  { type: mongoose.Schema.Types.ObjectId, ref: 'Symptom' },
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // Rule-based engine output
        ruleEngine: {
            priority:      { type: String, enum: ['stable', 'moderate', 'high', 'critical'] },
            score:         { type: Number, min: 0, max: 100 },
            reasoning:     [reasoningItemSchema],
            triggeredRules:[{ type: String }],
        },

        // ML model output
        mlModel: {
            priority: { type: String, enum: ['stable', 'moderate', 'high', 'critical'] },
            probabilityMap: {
                stable:   { type: Number },
                moderate: { type: Number },
                high:     { type: Number },
                critical: { type: Number },
            },
            confidence:   { type: Number },
            modelVersion: { type: String },
            available:    { type: Boolean, default: false },
        },

        // Final merged priority (max of rule + ML)
        finalPriority:  { type: String, enum: ['stable', 'moderate', 'high', 'critical'], required: true },
        finalScore:     { type: Number, min: 0, max: 100 }, // backward-compat: max(physical, mental)
        prioritySource: { type: String, enum: ['rule_engine', 'ml_model', 'tie', 'doctor_override'] },

        // ── Dual Risk Scores (new) ─────────────────────────────────
        physicalRiskScore: { type: Number, min: 0, max: 100, default: 0 },
        mentalRiskScore:   { type: Number, min: 0, max: 100, default: 0 },
        physicalSeverity:  { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
        mentalSeverity:    { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'], default: 'LOW' },
        physicalReasons:   [{ type: String }],
        mentalReasons:     [{ type: String }],

        // Doctor override
        doctorOverride: {
            overriddenBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            originalPriority: { type: String },
            newPriority:   { type: String },
            reason:        { type: String },
            overriddenAt:  { type: Date },
        },

        isActive:       { type: Boolean, default: true },
        vitalsSnapshot: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TriageResult', triageResultSchema);
