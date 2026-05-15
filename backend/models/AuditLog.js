const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        actorRole: { type: String },
        action: { type: String, required: true },          // e.g. "SUBMIT_SYMPTOM", "OVERRIDE_TRIAGE"
        resource: { type: String },                          // e.g. "TriageResult"
        resourceId: { type: mongoose.Schema.Types.ObjectId },
        targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // patient/doctor affected
        meta: { type: mongoose.Schema.Types.Mixed },     // extra context
        ip: { type: String },
        userAgent: { type: String },
        status: { type: String, enum: ['success', 'failure'], default: 'success' },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

// Auto-expire logs after 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
