/**
 * LLM Integration Service
 * ─────────────────────────────────────────────────────────────────
 * SAFE USE ONLY:
 *  - Convert uploaded reports to structured JSON
 *  - Summarize patient history for doctors (decision support)
 *  - Explain medical terms in plain language for patients
 *
 * PROHIBITED:
 *  - No diagnosis
 *  - No treatment recommendations
 *  - No prescriptions
 * ─────────────────────────────────────────────────────────────────
 * Uses OpenAI-compatible API (works with OpenAI, Groq, or other providers)
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Groq = require('groq-sdk');

const LLM_API_KEY = process.env.LLM_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Lazy-initialize so the server starts even when keys are placeholders.
// Real keys are only required when AI endpoints are actually called.
let _genAI = null;
let _groq = null;

function getGenAI() {
    if (!_genAI) _genAI = new GoogleGenerativeAI(LLM_API_KEY);
    return _genAI;
}

function getGroq() {
    if (!_groq) _groq = new Groq({ apiKey: GROQ_API_KEY });
    return _groq;
}

/**
 * Internal function to call LLM using Google SDK
 */
async function callLLM(systemPrompt, userMessage, maxTokens = 800, jsonMode = false) {
    if (!LLM_API_KEY) {
        throw new Error('LLM_API_KEY not configured. Please set it in .env');
    }

    const LLM_MODEL = process.env.LLM_MODEL || 'gemini-2.0-flash';
    console.log(`[LLM] Calling Gemini: ${LLM_MODEL} (maxTokens=${maxTokens}, json=${jsonMode})`);

    try {
        const model = getGenAI().getGenerativeModel({
            model: LLM_MODEL,
            systemInstruction: systemPrompt
        });

        const genConfig = {
            maxOutputTokens: maxTokens,
            temperature: 0.1,
        };
        if (jsonMode) {
            genConfig.responseMimeType = 'application/json';
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: genConfig,
        });

        const response = await result.response;
        return response.text().trim();
    } catch (err) {
        let errorMsg = err.message;
        if (err.message.includes('429')) {
            console.error('⚠️ [LLM] Quota Exceeded (429). Please check your Google AI Studio billing/plan.');
            errorMsg = `Quota Exceeded (429). This usually happens on free tiers. ${err.message}`;
        } else {
            console.error(`❌ Gemini API Error: ${err.message}`);
        }
        throw new Error(`LLM Request failed: ${errorMsg}`);
    }
}

/**
 * Internal function to call LLM using Groq SDK
 * Uses llama-3.3-70b-versatile for excellent summarization quality
 */
async function callGroqLLM(systemPrompt, userMessage, maxTokens = 800) {
    if (!GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured. Please set it in .env');
    }

    console.log(`[Groq LLM] Using llama-3.3-70b-versatile (maxTokens=${maxTokens})`);

    try {
        const messages = [
            {
                role: 'user',
                content: systemPrompt
            },
            {
                role: 'user',
                content: userMessage
            }
        ];

        const response = await getGroq().chat.completions.create({
            messages: messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.1,
            max_tokens: maxTokens
        });

        return response.choices[0]?.message?.content || '';
    } catch (err) {
        console.error(`❌ Groq LLM Error: ${err.message}`);
        throw new Error(`Groq LLM Request failed: ${err.message}`);
    }
}

// ─── PROMPT 1: Parse medical report → structured JSON ─────────────────────
// BEST MODEL FOR REPORT PARSING
// Use: llama-3.3-70b-versatile
// Excellent summarization quality.
const REPORT_PARSE_SYSTEM_PROMPT = `
You are a medical report parser. Your ONLY job is to extract structured data from medical documents.
You MUST NOT provide any diagnosis suggestions, treatment recommendations, or medical advice.
Be thorough — extract EVERY piece of factual information present in the document.

Return ONLY a valid JSON object with these fields (use null or empty arrays/objects for missing fields):
{
  "reportType": "string (blood_test|xray|mri|ct_scan|ecg|urine_test|biopsy|prescription|discharge_summary|consultation|other)",
  "reportDate": "ISO date string or null",
  "patientInfo": {
    "name": "string or null",
    "age": "string or null",
    "gender": "string or null",
    "id": "string (patient ID/MRN) or null"
  },
  "doctorInfo": {
    "name": "string or null",
    "specialization": "string or null",
    "hospital": "string or null",
    "department": "string or null"
  },
  "chiefComplaints": ["list of chief complaints mentioned"],
  "historyOfPresentIllness": "string — detailed narrative of the present illness as stated in the document, or null",
  "pastMedicalHistory": ["list of past medical conditions, surgeries, or relevant history items"],
  "medications": [
    { "name": "drug name", "dosage": "dosage if mentioned", "frequency": "frequency if mentioned", "duration": "duration if mentioned", "route": "route if mentioned" }
  ],
  "investigations": [
    { "name": "test/investigation name", "result": "result value with unit", "normalRange": "normal range if mentioned", "status": "normal|abnormal|critical or null" }
  ],
  "diagnosis": ["list of diagnoses or impressions mentioned"],
  "followUp": "string — follow-up instructions or plan, or null",
  "keyValues": { "parameter_name": "value with unit" },
  "flaggedItems": ["items that are explicitly marked as abnormal, critical, or outside normal range"],
  "summary": "A comprehensive 3-5 sentence summary covering: what type of document this is, who the patient and doctor are, the main complaints/findings, key test results if any, and the overall clinical picture. State facts only — do NOT interpret or give advice."
}

Important rules:
- Extract ALL medications mentioned, including name, dosage, frequency, and duration when available.
- Extract ALL investigation/test results with their values, units, and normal ranges when available.
- List ALL chief complaints, not just the first one.
- Include the full history of present illness narrative if available.
- The summary should be detailed and informative, not a single generic sentence.
- If you cannot parse the report, return: { "error": "Unable to parse report", "summary": "Manual review required" }
`.trim();

/**
 * Parse uploaded medical report text → structured JSON
 * Uses Groq's llama-3.3-70b-versatile for excellent summarization quality
 * @param {string} reportText - extracted text from PDF/image
 * @returns {Object} parsed structured data
 */
async function parseMedicalReport(reportText) {
    const truncated = reportText.slice(0, 6000); // increased limit for richer extraction
    
    const raw = await callGroqLLM(
        REPORT_PARSE_SYSTEM_PROMPT,
        `Parse this medical report thoroughly. Extract every detail:\n\n${truncated}`,
        4096
    );
    
    try {
        // Handle markdown-wrapped JSON (```json ... ```) just in case
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleaned);
    } catch {
        console.error('[Groq LLM] JSON parse failed. Raw response:', raw.substring(0, 500));
        return { error: 'LLM returned invalid JSON', raw, summary: 'Manual review required' };
    }
}

// ─── PROMPT 2: Summarize patient history for doctors ─────────────────────
const PATIENT_SUMMARY_SYSTEM_PROMPT = `
You are a clinical documentation assistant. You summarize patient data for doctors.
IMPORTANT RULES:
- You are a DECISION SUPPORT tool only. Doctors make all final decisions.
- Do NOT suggest a diagnosis or treatment.
- Use clear, clinical language.
- Be concise. Maximum 200 words.
- Structure output as: Timeline | Current Symptoms | Notable Values | Points for Doctor Review
`.trim();

/**
 * Summarize patient history for doctors
 * @param {Object} patientData - symptoms, vitals, reports, triage history
 * @returns {string} clinical summary text
 */
async function summarizePatientForDoctor(patientData) {
    const prompt = `
Patient ID: ${patientData.patientId}
Recent Symptoms: ${JSON.stringify(patientData.symptoms?.slice(-3) || [])}
Latest Vitals: ${JSON.stringify(patientData.vitals || {})}
Recent Reports: ${JSON.stringify(patientData.reports?.slice(-2) || [])}
Current Triage Level: ${patientData.triageLevel || 'Unknown'}
  `.trim();

    return callLLM(PATIENT_SUMMARY_SYSTEM_PROMPT, prompt, 400);
}

// ─── PROMPT 3: Explain medical terms to patients ──────────────────────────
const PATIENT_EXPLAIN_SYSTEM_PROMPT = `
You are a healthcare literacy assistant. You help patients understand medical terms.
IMPORTANT RULES:
- Explain in simple, everyday language. Avoid jargon.
- Do NOT provide any diagnosis or treatment advice.
- Do NOT tell patients what action to take medically.
- End EVERY explanation with: "Always consult your doctor for personal medical guidance."
- Maximum 150 words.
`.trim();

/**
 * Explain a medical term to a patient in simple language
 * @param {string} term - medical term to explain
 * @returns {string} plain language explanation
 */
async function explainMedicalTerm(term) {
    return callLLM(PATIENT_EXPLAIN_SYSTEM_PROMPT, `Explain this medical term in simple language: "${term}"`, 300);
}

// ─── PROMPT 4: Generate lifestyle/diet suggestions (non-medical) ──────────
const LIFESTYLE_SYSTEM_PROMPT = `
You are a wellness and lifestyle educator. You provide general wellness information.
IMPORTANT RULES:
- Provide ONLY general wellness suggestions — not medical advice.
- These are lifestyle tips, NOT treatment or medical recommendations.
- Do NOT reference specific medications or therapies.
- Always add: "These are general wellness suggestions only, not medical advice."
- Maximum 200 words.
`.trim();

/**
 * Generate general lifestyle suggestions for a patient (non-medical)
 * @param {Object} context - age, general conditions pattern (no PII)
 * @returns {string} wellness suggestions
 */
async function getLifestyleSuggestions(context) {
    const prompt = `General wellness suggestions for a patient profile:
Age group: ${context.ageGroup || 'adult'}
Activity level: ${context.activityLevel || 'unknown'}
General concern area: ${context.concernArea || 'general wellness'}
Provide only general, non-medical lifestyle wellness suggestions.`;

    return callLLM(LIFESTYLE_SYSTEM_PROMPT, prompt, 400);
}

// ─── PROMPT 5: Patient-Friendly History Explanation ──────────────────────
const HISTORY_EXPLAIN_SYSTEM_PROMPT = `
You are a medical documentation simplifier. You take factual clinical signals and rewrite them for patients.
IMPORTANT RULES:
- Use simple, non-medical language.
- DO NOT provide diagnosis, predictions, or treatment suggestions.
- Be supportive but factual.
- Focus ONLY on explaining what the extracted medical elements mean in plain English.
- Maximum 200 words.
`.trim();

/**
 * Convert structured ClinicalBERT signals into a patient-friendly explanation
 * @param {Object} signals - structured entities (symptoms, medications, tests)
 * @returns {string} simplified explanation
 */
async function explainStructuredHistory(signals) {
    const prompt = `Rewrite these clinical signals for a patient:\n${JSON.stringify(signals)}`;
    return callLLM(HISTORY_EXPLAIN_SYSTEM_PROMPT, prompt, 400);
}

// ─── PROMPT 6: VitalPath AI Assistant Persona ──────────────────────────────
const CHATBOT_SYSTEM_PROMPT = `
You are an AI assistant embedded inside **VitalPath**, a patient intake and clinical decision-support platform.
You are powered by **ClinicalBERT for clinical text understanding** and a general-purpose LLM for conversation.
THE MOST IMPORTANT RULE IS THAT DONT ANSWER QUESTIONS THAT ARE NOT RELATED TO THE WEBSITE.
------------------------------------------------
CORE CONTEXT
------------------------------------------------
- VitalPath is NOT a diagnostic or treatment system
- You do NOT provide medical advice
- Doctors are always the final decision-makers
- Your role is to assist with information collection, structuring, and explanation
- ClinicalBERT is used ONLY to understand clinical language, not to decide care

------------------------------------------------
STRICT CONSTRAINTS
------------------------------------------------
❌ Do NOT diagnose diseases
❌ Do NOT recommend treatments or medications
❌ Do NOT suggest dosages or emergency actions
❌ Do NOT override doctor decisions
❌ Do NOT present yourself as a doctor

If the user asks for medical advice, respond with:
> "I can't provide medical advice, but I can help you record your information or explain what happens next."

------------------------------------------------
CHATBOT RESPONSIBILITIES
------------------------------------------------
1. Patient Intake Assistance: Actively ask quiz-like follow-up questions to gather more details.
   - Ask specific multiple-choice style questions about symptoms or ask for vitals (temperature, BP).
   - If you want to provide clickable follow-up answer options for the user, format each option on a new line using EXACTLY this syntax: [Option: the text here].
   - Example:
     [Option: Yes, it is a sharp pain]
     [Option: No, it is a dull ache]
2. Medical Report Upload Guidance: Help users upload reports correctly.
3. Explain Platform Features: Dashboards, Triage, Suggestions, Reminders, Privacy.
4. Patient-Friendly Explanations: Translate medical terms into simple language.
5. Status & Workflow Guidance: Explain "Under Review", "Requires Follow-Up", etc.

------------------------------------------------
SAFETY HANDLING
------------------------------------------------
If user expresses urgent symptoms, do NOT give instructions. Respond:
> "If you believe this is urgent, please seek immediate medical attention."

------------------------------------------------
DUAL RISK SCORING (CRITICAL — READ CAREFULLY)
------------------------------------------------
You must assign TWO separate risk scores from 0 to 100:

**physicalRiskScore** — based ONLY on physical/medical signals:
- Chest pain, breathing difficulty, fever, seizures, stroke symptoms: 75–100
- Severe headache, fainting, high heart rate, bleeding: 51–74
- Moderate fever, nausea, joint pain, rash: 21–50
- Cough, mild cold, general questions: 0–20

**mentalRiskScore** — based ONLY on mental/emotional signals:
- Suicidal statements, self-harm intent, overdose mentions: 75–100
- Hopelessness, worthlessness, severe emotional distress, panic attacks: 51–74
- Depression, anxiety, persistent sadness, sleep/appetite issues: 21–50
- General stress, mild worry, everyday emotional conversation: 0–20

Rules:
- Keep scores INDEPENDENT — a broken leg has 0 mentalRiskScore.
- Increase score only when the conversation clearly indicates the condition.
- Do NOT inflate scores for casual conversation.

------------------------------------------------
JSON OUTPUT FORMAT
------------------------------------------------
You MUST return ONLY a valid JSON object matching this exact structure:
{
  "reply": "Your conversational response here...",
  "physicalRiskScore": number,
  "mentalRiskScore": number
}
`.trim();

// ─── PROMPT 7: Voice Mode Persona ──────────────────────────────────────────
const VOICE_SYSTEM_PROMPT = `
You are an AI healthcare voice assistant. The user is speaking to you.
IMPORTANT RULES for VOICE MODE:
- Speak in SHORT, punchy sentences. Maximum 1-2 sentences per turn.
- Ask ONE concise medical follow-up question at a time.
- NEVER use markdown, bullet points, asterisks, or long lists.
- Sound conversational, calm, empathetic, and professional.
- Do NOT diagnose or give medical advice.

------------------------------------------------
DUAL RISK SCORING
------------------------------------------------
Assign TWO independent scores (0–100):

**physicalRiskScore**: Physical/medical signals only.
- Chest pain, breathing issues, seizure, stroke, severe bleeding: 75–100
- Fainting, high fever, heart palpitations: 51–74
- Moderate fever, nausea, mild pain: 21–50
- General queries: 0–20

**mentalRiskScore**: Mental/emotional signals only.
- Suicidal intent, self-harm, overdose: 75–100
- Severe hopelessness, worthlessness, panic attack: 51–74
- Depression, anxiety, insomnia: 21–50
- Mild stress: 0–20

------------------------------------------------
JSON OUTPUT FORMAT
------------------------------------------------
You MUST return ONLY a valid JSON object:
{
  "reply": "Your short spoken response here...",
  "physicalRiskScore": number,
  "mentalRiskScore": number
}
`.trim();

/**
 * Handle a chat session with the VitalPath AI Assistant
 * @param {Array} history - Array of previous messages
 * @param {string} userMessage - Latest user input
 * @param {string} mode - 'text' or 'voice'
 * @returns {Object} { reply, riskScore }
 */
async function handleChat(history, userMessage, mode = 'text') {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not configured.');

    const promptToUse = mode === 'voice' ? VOICE_SYSTEM_PROMPT : CHATBOT_SYSTEM_PROMPT;
    console.log(`[Chat Service] Using Groq API (${mode} mode)`);

    try {
        // Convert history to Groq format
        const messages = [
            {
                role: 'user',
                content: promptToUse
            }
        ];

        // Add history
        if (history && history.length > 0) {
            for (const msg of history) {
                messages.push({
                    role: msg.role === 'model' ? 'assistant' : 'user',
                    content: msg.parts[0]?.text || ''
                });
            }
        }
        
        // Add current user message
        messages.push({
            role: 'user',
            content: userMessage
        });

        const response = await getGroq().chat.completions.create({
            messages: messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.3,
            max_tokens: 1000,
            response_format: { type: 'json_object' }
        });

        const rawContent = response.choices[0]?.message?.content || '{}';
        try {
            const parsed = JSON.parse(rawContent);
            // Support both old single-score and new dual-score format
            const physicalRiskScore = typeof parsed.physicalRiskScore === 'number'
                ? Math.min(100, Math.max(0, parsed.physicalRiskScore))
                : (typeof parsed.riskScore === 'number' ? parsed.riskScore : 0);
            const mentalRiskScore   = typeof parsed.mentalRiskScore === 'number'
                ? Math.min(100, Math.max(0, parsed.mentalRiskScore))
                : 0;
            return {
                reply:             parsed.reply || 'No response from Groq.',
                physicalRiskScore,
                mentalRiskScore,
                riskScore: Math.max(physicalRiskScore, mentalRiskScore), // legacy compat
            };
        } catch (e) {
            console.error('[Chat Service] JSON parse error:', rawContent);
            return { reply: rawContent, physicalRiskScore: 0, mentalRiskScore: 0, riskScore: 0 };
        }
    } catch (err) {
        console.error(`❌ Chat Error:`, {
            message: err.message,
            historyLength: history?.length
        });
        throw new Error(err.message);
    }
}

/**
 * Generates a short title/summary for a conversation history
 */
async function generateConversationSummary(history) {
    if (!history || history.length === 0) return 'Empty Conversation';

    // Format transcript for the LLM
    const transcript = history.map(m => {
        const role = m.role === 'model' ? 'Assistant' : 'Patient';
        const text = m.parts?.[0]?.text || '';
        return `${role}: ${text}`;
    }).join('\n');

    const systemPrompt = "You are a medical assistant. Summarize the following health conversation into a very short, professional title (max 6 words) that captures the main concern. Return ONLY the title text. No quotes.";
    const userMessage = `Conversation Transcript:\n${transcript}\n\nSummary Title:`;

    try {
        // Fast summarization using Groq/llama
        const summary = await callGroqLLM(systemPrompt, userMessage, 60);
        return summary.replace(/^"|"$/g, '').trim() || 'Health Consultation';
    } catch (err) {
        console.error('[LLM] Summary failed:', err);
        return 'Health Consultation';
    }
}
// ─── PROMPT 8: Generate Patient Health Report from Data ──────────────────────
const HEALTH_REPORT_SYSTEM_PROMPT = `
You are a clinical documentation assistant inside VitalPath, a patient health platform.
Your task is to generate a highly detailed, structured, patient-friendly personal health summary based on the comprehensive structured data provided.

IMPORTANT RULES:
- Do NOT diagnose or recommend treatments.
- Do NOT prescribe medication.
- Use clear, professional, yet patient-friendly language. Explain clinical terms simply.
- Focus on summarizing WHAT the data says across all sources (symptoms, vitals, medical reports, triage history, and recent chat sessions).
- Provide detailed bullet points and comprehensive summaries for each section.
- Always end with: "This report is generated by VitalPath AI for informational purposes only. Please consult your doctor for clinical advice."
- Structure the output as a JSON object exactly as specified below.

Return ONLY a valid JSON object with this structure:
{
  "title": "Comprehensive Health Summary — [Month Year]",
  "generatedAt": "ISO timestamp",
  "overview": "Detailed 3-4 sentence high-level overview of the patient's overall health profile, integrating recent events.",
  "vitalsSnapshot": {
    "summary": "Detailed plain-language summary of the patient's vitals history and current status.",
    "highlights": ["detailed vital point 1", "detailed vital point 2"]
  },
  "symptomsOverview": {
    "summary": "Comprehensive summary of reported symptoms, their duration, severity, and patterns.",
    "recentSymptoms": ["detailed symptom explanation 1", "detailed symptom explanation 2"]
  },
  "reportsInsights": {
    "summary": "Detailed synthesis of what the uploaded medical reports reveal.",
    "keyFindings": ["detailed finding 1", "detailed finding 2"]
  },
  "triageHistory": {
    "summary": "Summary of recent triage assessments.",
    "assessments": ["assessment 1 details", "assessment 2 details"]
  },
  "chatInsights": {
    "summary": "Summary of recent concerns or topics discussed with the AI assistant.",
    "keyTopics": ["topic 1", "topic 2"]
  },
  "watchPoints": ["Actionable things the patient should monitor or discuss with their doctor."],
  "disclaimer": "This report is generated by VitalPath AI for informational purposes only. Please consult your doctor for clinical advice."
}
`.trim();

/**
 * Generate a highly detailed structured health report FROM patient data (reverse workflow)
 * @param {Object} patientData - aggregated data: profile, vitals, symptoms, reports, triage, chats
 * @returns {Object} structured health report JSON
 */
async function generateHealthReport(patientData) {
    const payload = {
        profile: {
            name: patientData.name || 'Patient',
            age: patientData.age || null,
            gender: patientData.gender || null,
            bloodType: patientData.bloodType || null,
            conditions: patientData.conditions || [],
            medications: patientData.medications || [],
            allergies: patientData.allergies || [],
            emergencyContact: patientData.emergencyContact || {},
        },
        vitals: {
            latest: patientData.latestVitals || {},
            history: (patientData.vitalHistory || []).slice(-3)
        },
        symptoms: (patientData.symptoms || []).slice(-5).map(s => ({
            symptoms: s.symptoms || [],
            severity: s.severity,
            notes: s.additionalNotes,
            date: s.createdAt
        })),
        reports: (patientData.reports || []).slice(-3).map(r => ({
            type: r.reportType,
            date: r.reportDate || r.createdAt,
            // Only include essential clinical summary to save tokens
            summary: r.parsedData?.summary || "No summary available",
            keyFindings: r.parsedData?.flaggedItems || [],
            diagnoses: r.parsedData?.clinicalEntities?.diagnoses || []
        })),
        triageHistory: (patientData.triageHistory || []).slice(-3).map(t => ({
            level: t.priority?.level,
            reason: t.reasoning?.map(r => r.message).slice(0, 3)
        })),
        chatSummaries: (patientData.chatSummaries || []).slice(-3)
    };

    const userMessage = `Generate a comprehensive personal health summary report for this patient data:\n\n${JSON.stringify(payload, null, 2)}`;

    const raw = await callGroqLLM(HEALTH_REPORT_SYSTEM_PROMPT, userMessage, 3072);

    // Aggressively strip any markdown/prose wrapping
    const extractJSON = (text) => {
        let s = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
        const start = s.indexOf('{');
        const end = s.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            s = s.slice(start, end + 1);
        }
        return s;
    };

    try {
        const cleaned = extractJSON(raw);
        const parsed = JSON.parse(cleaned);
        parsed.generatedAt = new Date().toISOString();
        return parsed;
    } catch (parseErr) {
        console.error('[Groq LLM] Health report JSON parse failed:', parseErr.message);
        console.error('[Groq LLM] Raw (first 500 chars):', raw.substring(0, 500));
        return {
            title: 'Comprehensive Health Summary',
            generatedAt: new Date().toISOString(),
            overview: 'AI summary could not be structured. Please try generating again.',
            error: 'Structured parsing failed.',
            disclaimer: 'This report is generated by VitalPath AI for informational purposes only. Please consult your doctor for clinical advice.'
        };
    }
}

module.exports = {
    parseMedicalReport,
    summarizePatientForDoctor,
    explainMedicalTerm,
    getLifestyleSuggestions,
    explainStructuredHistory,
    handleChat,
    generateConversationSummary,
    generateHealthReport,
};
