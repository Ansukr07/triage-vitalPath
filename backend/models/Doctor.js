const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        licenseNumber: { type: String, required: true, unique: true },
        specializations: [{ type: String }],
        qualifications: [{ type: String }],
        hospitalAffiliation: { type: String },
        department: { type: String },
        yearsOfExperience: { type: Number },
        availability: {
            days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
            startTime: { type: String },  // e.g. "09:00"
            endTime: { type: String },  // e.g. "17:00"
        },
        patientQueue: [
            {
                patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
                addedAt: { type: Date, default: Date.now },
                priority: { type: String, enum: ['stable', 'moderate', 'high', 'critical'], default: 'stable' },
                notes: { type: String },
                status: { type: String, enum: ['waiting', 'in_progress', 'completed', 'discharged'], default: 'waiting' },
            },
        ],
        isVerified: { type: Boolean, default: false },
        bio: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Doctor', doctorSchema);
