const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        description: { type: String },
        type: {
            type: String,
            enum: ['appointment', 'test', 'follow_up', 'medication', 'lifestyle', 'other'],
            default: 'appointment',
        },
        medicationName: { type: String },
        medicationDose: { type: String },
        medicationInstructions: { type: String },
        scheduledAt: { type: Date, required: true },
        status: { type: String, enum: ['upcoming', 'completed', 'missed', 'cancelled'], default: 'upcoming' },
        location: { type: String },
        doctorName: { type: String },
        isRecurring: { type: Boolean, default: false },
        recurrenceRule: { type: String },   // e.g. "weekly", "monthly"
        notificationSent: { type: Boolean, default: false },
        telegramSent: { type: Boolean, default: false },
        telegramMessageId: { type: Number },
        telegramError: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Reminder', reminderSchema);
