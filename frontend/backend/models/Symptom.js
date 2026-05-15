const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        symptoms: [
            {
                name: { type: String, required: true },
                severity: { type: Number, min: 1, max: 10, required: true },  // 1-10 scale
                duration: { type: String, required: true },   // e.g. "3 days", "2 weeks"
                durationDays: { type: Number },                  // normalized to days for engine
                frequency: { type: String, enum: ['constant', 'frequent', 'occasional', 'rare'], required: true },
                bodyPart: { type: String },
                notes: { type: String },
            },
        ],
        additionalNotes: { type: String },
        currentVitals: {
            bloodPressureSystolic: { type: Number },
            bloodPressureDiastolic: { type: Number },
            heartRate: { type: Number },
            temperature: { type: Number },
            oxygenSaturation: { type: Number },
            respiratoryRate: { type: Number },
            bloodGlucose: { type: Number },
        },
        status: { type: String, enum: ['pending', 'reviewed', 'closed'], default: 'pending' },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        clinicalEmbeddings: [{ type: Number }], // BERT embeddings for triage/risk logic
    },
    { timestamps: true }
);

module.exports = mongoose.model('Symptom', symptomSchema);
