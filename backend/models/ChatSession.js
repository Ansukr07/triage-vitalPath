const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    role:    { type: String, enum: ['user', 'assistant', 'model'], required: true },
    content: { type: String, required: true },
    ts:      { type: Date, default: Date.now },
    error:   { type: Boolean, default: false },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:    { type: String, required: true, maxlength: 120 },
    type:     { type: String, enum: ['text', 'voice'], default: 'text' },
    messages: [messageSchema],
    // ── Latest Triage metadata for this session ──────
    latestPhysicalRiskScore: { type: Number, default: 0 },
    latestMentalRiskScore:   { type: Number, default: 0 },
    latestPhysicalSeverity:  { type: String, default: 'LOW' },
    latestMentalSeverity:    { type: String, default: 'LOW' },
    latestPhysicalReasons:   [{ type: String }],
    latestMentalReasons:     [{ type: String }],
    latestCareCategory:      { type: String },
    latestEmergency:         { type: mongoose.Schema.Types.Mixed },
    // ─── EHR Extensions ──────────────────────────────────────────────────
    riskScore: { type: Number, min: 0, max: 100, default: 0 },
    riskLevel: {
      type: String,
      enum: ['stable', 'moderate', 'high', 'critical'],
      default: 'stable',
    },
    aiSummary: { type: String },
    extractedSymptoms: [{ type: String }],
    triageRef: { type: mongoose.Schema.Types.ObjectId, ref: 'TriageResult' },
    hadEmergency: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatSession', chatSessionSchema);
