const mongoose = require('mongoose');

/**
 * EscalationLog.js
 * Stores a persistent record of every emergency escalation event.
 */
const escalationLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        // Emergency classification
        emergencyType: {
            type: String,
            enum: ['suicide', 'cardiac', 'stroke', 'seizure', 'breathing', 'trauma', 'critical'],
            required: true,
        },
        severity: {
            type: String,
            enum: ['high', 'critical'],
            required: true,
        },
        reason: { type: String, required: true },
        detectedSymptoms: [{ type: String }],

        // Alert delivery
        telegramAlertSent: { type: Boolean, default: false },
        telegramMessageId:  { type: Number },
        telegramError:      { type: String },

        // Context snapshot
        conversationSummary: { type: String },
        riskScore:           { type: Number },
        location: {
            latitude:  { type: Number },
            longitude: { type: Number },
        },

        // Acknowledgment (for admin dashboard)
        acknowledged: { type: Boolean, default: false },
        acknowledgedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        acknowledgedAt: { type: Date },
        acknowledgeNote: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('EscalationLog', escalationLogSchema);
