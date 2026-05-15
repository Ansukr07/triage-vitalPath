const mongoose = require('mongoose');

const medicalReportSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        mimeType: { type: String, required: true },
        fileSize: { type: Number },           // bytes
        filePath: { type: String, required: true },
        reportType: {
            type: String,
            enum: ['blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'urine_test', 'biopsy', 'prescription', 'discharge_summary', 'other'],
            default: 'other',
        },
        reportDate: { type: Date },              // date on the report itself
        // LLM-parsed structured data
        parsedData: {
            summary: { type: String },           // LLM plain-language summary for patient
            keyValues: { type: Map, of: String },  // e.g. { "hemoglobin": "12.5 g/dL" }
            flaggedItems: [{ type: String }],         // items outside normal range
            rawJson: { type: mongoose.Schema.Types.Mixed },
            parsedAt: { type: Date },
            parseStatus: { type: String, enum: ['pending', 'processing', 'done', 'failed'], default: 'pending' },
            // Rich extraction fields
            patientInfo: { type: mongoose.Schema.Types.Mixed },    // { name, age, gender, id }
            doctorInfo: { type: mongoose.Schema.Types.Mixed },     // { name, specialization, hospital, department }
            chiefComplaints: [{ type: String }],
            historyOfPresentIllness: { type: String },
            pastMedicalHistory: [{ type: String }],
            medications: [{ type: mongoose.Schema.Types.Mixed }],  // [{ name, dosage, frequency, duration, route }]
            investigations: [{ type: mongoose.Schema.Types.Mixed }], // [{ name, result, normalRange, status }]
            diagnosis: [{ type: String }],
            followUp: { type: String },
        },
        // ClinicalBERT structured data
        clinicalEntities: {
            symptoms: [{ type: String }],
            conditions: [{ type: String }],
            medications: [{ type: String }],
            tests: [{ type: String }],
        },
        bertClassification: {
            docType: { type: String },
            consultationType: { type: String },
            confidence: { type: Number },
        },
        doctorNotes: { type: String },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MedicalReport', medicalReportSchema);
