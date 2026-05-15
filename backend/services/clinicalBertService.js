const axios = require('axios');

/**
 * ClinicalBERT Integration Service
 * ─────────────────────────────────────────────────────────────────
 * Bridge to the Python-based ClinicalBERT microservice (port 8001).
 *
 * SAFE USE ONLY:
 * - Extraction of clinical entities (symptoms, medications, tests)
 * - Classification of medical document types
 * - Severity scoring split by domain (physical vs mental)
 *
 * PROHIBITED:
 * - No diagnostic claims
 * - No treatment recommendations
 * ─────────────────────────────────────────────────────────────────
 */

const BERT_SERVICE_URL = process.env.BERT_SERVICE_URL || 'http://localhost:8001';
const BERT_TIMEOUT_MS  = 15000;
const OCR_TIMEOUT_MS   = 60000;

async function extractEntities(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/extract`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT extraction unavailable.', err.message);
        return { available: false, symptoms: [], conditions: [], medications: [], tests: [] };
    }
}

async function extractEntitiesOCR(filePath) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/extract_ocr`, { file_path: filePath }, {
            timeout: OCR_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT OCR extraction unavailable.', err.message);
        return { available: false, symptoms: [], conditions: [], medications: [], tests: [] };
    }
}

async function classifyDocument(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/classify`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT classification unavailable.', err.message);
        return { available: false, doc_type: 'unknown', consultation_type: 'routine', confidence: 0 };
    }
}

async function getClinicalEmbeddings(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/encode`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, embeddings: response.data.embeddings };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT encoding unavailable.', err.message);
        return { available: false, embeddings: [] };
    }
}

async function findSimilarCases(targetEmbedding, candidateEmbeddings, topK = 5) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/similarity`, {
            target_embedding: targetEmbedding,
            candidate_embeddings: candidateEmbeddings,
            top_k: topK,
        }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT similarity search unavailable.', err.message);
        return { available: false, indices: [], scores: [] };
    }
}

// ─── Physical Symptom Severity Weights ──────────────────────────────────────
// [keyword, score (0–100), reason label]
const PHYSICAL_WEIGHTS = [
    // Critical (75–100)
    ['heart attack',          95, 'Cardiac emergency — heart attack mentioned'],
    ['cardiac arrest',        95, 'Cardiac arrest — life-threatening event'],
    ['stroke',                90, 'Stroke symptoms detected — neurological emergency'],
    ['seizure',               88, 'Seizure or convulsion reported'],
    ['unconscious',           90, 'Loss of consciousness reported'],
    ['unresponsive',          90, 'Unresponsive state described'],
    ['severe chest pain',     88, 'Severe chest pain — potential cardiac event'],
    ['crushing chest',        90, 'Crushing chest pain — cardiac emergency indicator'],
    ['gasping',               85, 'Gasping — severe respiratory distress'],
    ['choking',               85, 'Choking episode reported'],
    ['cannot breathe',        85, 'Inability to breathe — respiratory emergency'],
    ['severe bleeding',       88, 'Severe or uncontrolled bleeding'],
    ['hemorrhage',            90, 'Hemorrhage — major bleeding event'],
    ['anaphylaxis',           88, 'Anaphylaxis — severe allergic reaction'],
    ['vomiting blood',        82, 'Hematemesis — gastrointestinal emergency'],
    ['coughing blood',        80, 'Hemoptysis — respiratory emergency indicator'],
    ['loss of consciousness', 88, 'Loss of consciousness reported'],
    ['fell unconscious',      88, 'Sudden loss of consciousness'],
    ['convulsion',            86, 'Convulsion — neurological emergency'],
    ['paralysis',             85, 'Paralysis — neurological emergency'],
    ['face drooping',         80, 'Facial drooping — stroke warning sign (FAST)'],
    ['slurred speech',        78, 'Slurred speech — stroke/neurological warning sign'],
    ['sudden numbness',       72, 'Sudden numbness — stroke warning sign'],
    ['sudden weakness',       75, 'Sudden weakness — potential stroke symptom'],
    ['severe headache',       70, 'Severe headache — possible neurological event'],

    // High (51–74)
    ['chest pain',            70, 'Chest pain reported — cardiac evaluation needed'],
    ['chest tightness',       65, 'Chest tightness — possible cardiac/respiratory issue'],
    ['shortness of breath',   62, 'Shortness of breath — respiratory distress'],
    ['difficulty breathing',  65, 'Breathing difficulty reported'],
    ['breathlessness',        58, 'Breathlessness — respiratory concern'],
    ['palpitations',          55, 'Heart palpitations reported'],
    ['vision loss',           70, 'Sudden vision loss — neurological/ophthalmic emergency'],
    ['sudden confusion',      68, 'Sudden confusion — possible neurological event'],
    ['arm weakness',          68, 'Arm weakness — stroke warning sign'],
    ['high fever',            52, 'High fever — potential serious infection'],
    ['fainting',              65, 'Fainting episode — cardiovascular concern'],
    ['irregular heartbeat',   60, 'Irregular heartbeat — arrhythmia suspected'],
    ['blood in urine',        58, 'Hematuria — urological emergency evaluation needed'],

    // Moderate (21–50)
    ['fever',        28, 'Fever reported'],
    ['cough',        12, 'Cough reported'],
    ['headache',     22, 'Headache reported'],
    ['nausea',       22, 'Nausea reported'],
    ['vomiting',     32, 'Vomiting reported'],
    ['diarrhea',     24, 'Diarrhea reported'],
    ['fatigue',      18, 'Fatigue reported'],
    ['back pain',    24, 'Back pain reported'],
    ['joint pain',   24, 'Joint pain reported'],
    ['rash',         22, 'Skin rash reported'],
    ['dizziness',    38, 'Dizziness — moderate concern'],
    ['numbness',     45, 'Numbness reported'],
    ['swelling',     28, 'Swelling reported'],
    ['infection',    35, 'Signs of infection reported'],
];

// ─── Mental Health Severity Weights ────────────────────────────────────────
const MENTAL_WEIGHTS = [
    // Critical (75–100)
    ['kill myself',              100, 'Explicit suicidal statement detected'],
    ['want to die',               95, 'Active suicidal ideation expressed'],
    ['end my life',               98, 'Suicidal intent language present'],
    ['take my own life',          98, 'Explicit suicidal intent expressed'],
    ['suicide',                   92, 'Suicide mentioned directly'],
    ['suicidal',                  90, 'Suicidal ideation present'],
    ['self harm',                 88, 'Self-harm language detected'],
    ['self-harm',                 88, 'Self-harm language detected'],
    ['hurt myself',               85, 'Self-harm intent expressed'],
    ['cut myself',                88, 'Self-harm language detected'],
    ['overdose',                  90, 'Overdose mentioned — potential self-harm'],
    ['jump off',                  92, 'Suicidal ideation expressed'],
    ['hang myself',               95, 'Explicit suicidal method mentioned'],
    ['no reason to live',         90, 'Severe hopelessness with suicidal ideation'],
    ['better off dead',           92, 'Suicidal ideation with hopelessness'],
    ['ending it all',             90, 'Suicidal ideation expressed'],
    ["don't want to be here",     85, 'Passive suicidal ideation expressed'],
    ['psychosis',                 78, 'Psychotic episode mentioned'],
    ['hallucinating',             75, 'Hallucinations reported'],
    ['hearing voices',            78, 'Auditory hallucinations reported'],

    // High (51–74)
    ['worthless',                 68, 'Severe negative self-perception (hopelessness indicator)'],
    ['hopeless',                  72, 'Hopelessness — key depression/suicide risk factor'],
    ['no hope',                   70, 'Hopelessness expressed'],
    ['nothing matters',           65, 'Emotional numbness / anhedonia'],
    ["can't go on",               72, 'Severe distress — inability to cope'],
    ['give up',                   62, 'Emotional withdrawal expressed'],
    ["can't take it",             60, 'Acute emotional distress'],
    ['falling apart',             58, 'Severe psychological distress'],
    ['breakdown',                 60, 'Mental health crisis language'],
    ["can't cope",                62, 'Inability to cope expressed'],
    ['no one cares',              60, 'Social isolation and helplessness'],
    ['all alone',                 55, 'Severe social isolation expressed'],
    ['trapped',                   62, 'Feeling trapped — significant distress signal'],
    ['unbearable',                65, 'Extreme emotional pain expressed'],
    ['severe anxiety',            62, 'Severe anxiety reported'],
    ['panic attack',              58, 'Panic attack — acute anxiety event'],

    // Moderate (21–50)
    ['depressed',                 42, 'Depression symptoms reported'],
    ['depression',                44, 'Depression mentioned'],
    ['anxious',                   30, 'Anxiety symptoms present'],
    ['anxiety',                   32, 'Anxiety mentioned'],
    ['sad all the time',          38, 'Persistent sadness — depression indicator'],
    ["can't sleep",               28, 'Insomnia — common depression/anxiety symptom'],
    ['not eating',                30, 'Appetite loss — depression symptom'],
    ['lost interest',             38, 'Anhedonia — core depression symptom'],
    ['crying a lot',              35, 'Persistent tearfulness'],
    ['overwhelmed',               30, 'Emotional overwhelm expressed'],
    ['stressed',                  22, 'Stress symptoms present'],
    ['mood swings',               30, 'Mood instability reported'],
    ['irritable',                 25, 'Irritability — anxiety/depression symptom'],
    ['mental health',             25, 'Mental health concern raised'],
    ['exhausted emotionally',     32, 'Emotional exhaustion expressed'],
];

// ─── Shared helpers ──────────────────────────────────────────────────────────
function scoreFromWeightTable(text, weightTable) {
    const lower     = text.toLowerCase();
    const reasons   = [];
    const triggered = [];
    const seen      = new Set();
    let maxScore    = 0;
    let totalScore  = 0;
    let hitCount    = 0;

    for (const [keyword, weight, reason] of weightTable) {
        if (lower.includes(keyword) && !seen.has(keyword)) {
            seen.add(keyword);
            triggered.push(keyword);
            reasons.push(reason);
            totalScore += weight;
            hitCount++;
            if (weight > maxScore) maxScore = weight;
        }
    }

    let finalScore = 0;
    if (hitCount > 0) {
        const avgScore = totalScore / hitCount;
        finalScore = Math.round((maxScore * 0.60) + (avgScore * 0.40));
        finalScore = Math.min(100, Math.max(0, finalScore));
    }

    return { score: finalScore, reasons, triggeredTerms: triggered, hitCount };
}

// ─── Physical Severity Scorer ────────────────────────────────────────────────
/**
 * Score physical health risk from text using ClinicalBERT + weight table fallback.
 * @param {string} text - message + history context
 * @returns {Promise<{bertScore: number, reasons: string[], bertEntities: string[], bertAvailable: boolean}>}
 */
async function scorePhysicalSeverity(text) {
    try {
        // Try ClinicalBERT for entity extraction
        const bertResult = await extractEntities(text);
        const entities = [
            ...(bertResult.symptoms   || []),
            ...(bertResult.conditions || []),
        ].map(e => (typeof e === 'string' ? e : e.text || e.entity || '').toLowerCase());

        // Score entities against physical weight table
        const entityText   = entities.join(' ') + ' ' + text;
        const { score, reasons, triggeredTerms, hitCount } = scoreFromWeightTable(entityText, PHYSICAL_WEIGHTS);

        // Cluster escalation
        let finalScore = score;
        const extraReasons = [...reasons];
        if (hitCount >= 3 && finalScore < 51) {
            finalScore = Math.min(100, finalScore + 8);
            extraReasons.push('Multiple physical symptoms co-occurring');
        }

        console.log(`[ClinicalBERT] Physical severity: ${finalScore}/100 | terms: ${triggeredTerms.slice(0, 4).join(', ')}`);

        return {
            bertScore:     finalScore,
            bertEntities:  triggeredTerms,
            reasons:       extraReasons,
            bertAvailable: bertResult.available,
        };
    } catch (err) {
        console.warn('[ClinicalBERT] scorePhysicalSeverity failed gracefully:', err.message);
        return { bertScore: 0, bertEntities: [], reasons: [], bertAvailable: false };
    }
}

// ─── Mental Severity Scorer ──────────────────────────────────────────────────
/**
 * Score mental health risk from text using mental health keyword weight table.
 * Does NOT rely on ClinicalBERT (mental terms often missed by biomedical NER).
 * @param {string} text
 * @returns {Promise<{bertScore: number, reasons: string[], bertEntities: string[]}>}
 */
async function scoreMentalSeverity(text) {
    try {
        const { score, reasons, triggeredTerms, hitCount } = scoreFromWeightTable(text, MENTAL_WEIGHTS);

        let finalScore = score;
        const extraReasons = [...reasons];
        if (hitCount >= 3 && finalScore < 51) {
            finalScore = Math.min(100, finalScore + 10);
            extraReasons.push('Multiple co-occurring emotional distress signals detected');
        }

        if (finalScore === 0) {
            extraReasons.push('No significant mental health risk indicators detected');
        }

        console.log(`[ClinicalBERT] Mental severity: ${finalScore}/100 | terms: ${triggeredTerms.slice(0, 4).join(', ')}`);

        return {
            bertScore:     finalScore,
            bertEntities:  triggeredTerms,
            reasons:       extraReasons,
            bertAvailable: true, // pure rule-based, always available
        };
    } catch (err) {
        console.warn('[ClinicalBERT] scoreMentalSeverity failed gracefully:', err.message);
        return { bertScore: 0, bertEntities: [], reasons: ['Mental health scoring unavailable'], bertAvailable: false };
    }
}

/**
 * Legacy combined scorer (kept for backward compat — uses physical weights only)
 * @deprecated Use scorePhysicalSeverity + scoreMentalSeverity instead
 */
async function scoreChatSeverity(text) {
    const result = await scorePhysicalSeverity(text);
    return {
        bertScore:    result.bertScore,
        bertEntities: result.bertEntities,
        bertAvailable:result.bertAvailable,
    };
}

module.exports = {
    extractEntities,
    extractEntitiesOCR,
    classifyDocument,
    getClinicalEmbeddings,
    findSimilarCases,
    scorePhysicalSeverity,
    scoreMentalSeverity,
    scoreChatSeverity, // legacy
};
