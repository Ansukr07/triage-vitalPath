const express = require('express');
const router = express.Router();
const path = require('path');
const MedicalReport = require('../models/MedicalReport');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const audit = require('../middleware/audit');
const { parseMedicalReport, generateHealthReport } = require('../services/llmService');
const { extractEntities, extractEntitiesOCR, classifyDocument } = require('../services/clinicalBertService');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const Symptom = require('../models/Symptom');
const TriageResult = require('../models/TriageResult');

// ─── POST /api/reports/upload ─────────────────────────────────────────────
router.post(
    '/upload',
    protect,
    authorize('patient'),
    upload.single('report'),
    audit('UPLOAD_REPORT', 'MedicalReport'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        const { reportType, reportDate } = req.body;

        const report = await MedicalReport.create({
            patient: patient._id,
            uploadedBy: req.user._id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            reportType: reportType || 'other',
            reportDate: reportDate || null,
            parsedData: { parseStatus: 'pending' },
        });

        // Async: trigger LLM parsing (fire and forget — don't block response)
        triggerLLMParsing(report._id).catch((err) =>
            console.error('LLM parse error for report', report._id, err.message)
        );

        res.status(201).json({
            success: true,
            message: 'Report uploaded successfully. Parsing in progress.',
            data: {
                reportId: report._id,
                fileName: report.originalName,
                reportType: report.reportType,
                parseStatus: 'pending',
            },
        });
    }
);

// ─── GET /api/reports ─────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    const filter = { isDeleted: false };

    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        filter.patient = patient._id;
    } else if (req.query.patientId) {
        filter.patient = req.query.patientId;
    }

    const reports = await MedicalReport.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .select('-filePath');

    res.json({ success: true, data: reports });
});

// ─── GET /api/reports/:id ─────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    const report = await MedicalReport.findById(req.params.id).populate('uploadedBy', 'firstName lastName');

    if (!report || report.isDeleted) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.json({ success: true, data: report });
});

// ─── PATCH /api/reports/:id/notes ─────────────────────────────────────────
router.patch('/:id/notes', protect, authorize('doctor', 'admin'), async (req, res) => {
    const { notes } = req.body;
    const report = await MedicalReport.findByIdAndUpdate(
        req.params.id,
        { doctorNotes: notes, reviewedBy: req.user._id, reviewedAt: new Date() },
        { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, data: report });
});

// ─── DELETE /api/reports/:id ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Patients can only delete their own; doctors/admins can delete any
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient || !report.patient.equals(patient._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
    }

    report.isDeleted = true;
    await report.save();
    res.json({ success: true, message: 'Report deleted.' });
});

// ─── POST /api/reports/generate-summary ────────────────────────────────────
// Reverse workflow: generate AI health report FROM patient data
router.post('/generate-summary', protect, authorize('patient'), async (req, res) => {
    try {
        const ChatSession = require('../models/ChatSession');

        // Fetch patient profile
        const patient = await Patient.findOne({ user: req.user._id }).populate('user', 'firstName lastName email');
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        // Compute approximate age
        let age = null;
        if (patient.dateOfBirth) {
            const diffMs = Date.now() - new Date(patient.dateOfBirth).getTime();
            age = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
        }

        // Fetch ALL symptom logs (up to 20) with full detail
        const symptoms = await Symptom.find({ patient: patient._id })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean();

        // Fetch ALL medical reports with FULL parsed data
        const reports = await MedicalReport.find({ patient: patient._id, isDeleted: false })
            .sort({ createdAt: -1 })
            .limit(20)
            .select('-filePath -fileName')
            .lean();

        // Fetch ALL triage results (up to 10) with reasoning
        const triageHistory = await TriageResult.find({ patient: patient._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Fetch recent chat sessions (last 10, assistant messages summarised)
        const chatSessions = await ChatSession.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        // Distil chat sessions into topic + assistant summaries
        const chatSummaries = chatSessions.map(s => ({
            title: s.title,
            date: s.createdAt,
            type: s.type,
            exchanges: s.messages.length,
            // Include user messages only (patient-reported concerns)
            patientMessages: s.messages
                .filter(m => m.role === 'user')
                .map(m => m.content.slice(0, 300))
                .slice(0, 8),
        }));

        // Assemble full payload
        const patientData = {
            name: `${patient.user.firstName} ${patient.user.lastName}`,
            age,
            gender: patient.gender,
            bloodType: patient.bloodType,
            conditions: patient.conditions || [],
            medications: patient.medications || [],
            allergies: patient.allergies || [],
            emergencyContact: patient.emergencyContact || {},
            address: patient.address || {},
            latestVitals: patient.latestVitals || null,
            vitalHistory: (patient.vitalHistory || []).slice(-10),
            symptoms,
            reports,
            triageHistory,
            currentTriageStatus: patient.triageStatus || 'unknown',
            lastTriageAt: patient.lastTriageAt || null,
            chatSummaries,
        };

        console.log(`[Health Report] Generating detailed report for patient: ${patient._id}`);
        const report = await generateHealthReport(patientData);

        res.json({ success: true, data: report });
    } catch (err) {
        console.error('[Health Report] Generation failed:', err.message);
        res.status(500).json({ success: false, message: err.message || 'Report generation failed.' });
    }
});


// ─── POST /api/reports/:id/reparse ────────────────────────────────────────
router.post('/:id/reparse', protect, authorize('admin', 'doctor', 'patient'), async (req, res) => {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Trigger re-parsing
    triggerLLMParsing(report._id).catch((err) =>
        console.error('LLM re-parse error for report', report._id, err.message)
    );

    res.json({ success: true, message: 'Re-parsing triggered.' });
});

// ─── Internal: Async LLM parsing ─────────────────────────────────────────
async function triggerLLMParsing(reportId) {
    const report = await MedicalReport.findById(reportId);
    if (!report) return;

    await MedicalReport.findByIdAndUpdate(reportId, { 'parsedData.parseStatus': 'processing' });

    try {
        // Extract text from the uploaded file
        let extractedText = `Report type: ${report.reportType}, Original Name: ${report.originalName}`;

        try {
            if (report.mimeType === 'application/pdf') {
                const dataBuffer = fs.readFileSync(report.filePath);
                const pdfData = await pdfParse(dataBuffer);
                extractedText = pdfData.text || extractedText;
                console.log(`[OCR] Extracted ${extractedText.length} chars from PDF: ${report.originalName}`);
            } else if (report.mimeType.startsWith('text/')) {
                extractedText = fs.readFileSync(report.filePath, 'utf8');
            }
        } catch (extractErr) {
            console.error('Text extraction failed:', extractErr.message);
            // Fallback to placeholder if extraction fails
            extractedText = `[SCAN FAILED] ${report.reportType}: ${report.originalName}`;
        }

        const truncatedText = extractedText.slice(0, 5000); // safety limit

        // Concurrently parse with LLM and ClinicalBERT
        // Fallback to OCR if text extraction yield next to nothing (< 800 chars)
        const useOCR = truncatedText.trim().length < 800 && report.mimeType === 'application/pdf';
        console.log(`[OCR Decider] Text Length: ${truncatedText.trim().length}, MIME: ${report.mimeType}, Use OCR: ${useOCR}`);

        const [parsed, bertEntities, bertClass] = await Promise.all([
            parseMedicalReport(truncatedText),
            useOCR ? extractEntitiesOCR(report.filePath) : extractEntities(truncatedText),
            classifyDocument(truncatedText)
        ]);

        console.log(`[BERT Result] Entities: ${bertEntities.available}, DocType: ${bertClass.doc_type}`);

        await MedicalReport.findByIdAndUpdate(reportId, {
            'parsedData.summary': parsed.summary || 'Summarization unavailable.',
            'parsedData.keyValues': parsed.keyValues || {},
            'parsedData.flaggedItems': parsed.flaggedItems || [],
            'parsedData.rawJson': parsed,
            'parsedData.parsedAt': new Date(),
            'parsedData.parseStatus': 'done',
            // Rich extraction fields from expanded LLM prompt
            'parsedData.patientInfo': parsed.patientInfo || null,
            'parsedData.doctorInfo': parsed.doctorInfo || null,
            'parsedData.chiefComplaints': parsed.chiefComplaints || [],
            'parsedData.historyOfPresentIllness': parsed.historyOfPresentIllness || null,
            'parsedData.pastMedicalHistory': parsed.pastMedicalHistory || [],
            'parsedData.medications': parsed.medications || [],
            'parsedData.investigations': parsed.investigations || [],
            'parsedData.diagnosis': parsed.diagnosis || [],
            'parsedData.followUp': parsed.followUp || null,
            // ClinicalBERT Data
            clinicalEntities: {
                symptoms: bertEntities.symptoms || [],
                conditions: bertEntities.conditions || [],
                medications: bertEntities.medications || [],
                tests: bertEntities.tests || []
            },
            bertClassification: {
                docType: bertClass.doc_type || 'unknown',
                consultationType: bertClass.consultation_type || 'routine',
                confidence: bertClass.confidence || 0
            }
        });
    } catch (err) {
        await MedicalReport.findByIdAndUpdate(reportId, {
            'parsedData.parseStatus': 'failed',
        });
        throw err;
    }
}

module.exports = router;
