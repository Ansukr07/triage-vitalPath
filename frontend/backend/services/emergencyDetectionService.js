/**
 * emergencyDetectionService.js
 * Detects critical / emergency conditions from conversation state.
 * Uses keyword matching AND dual risk score thresholds.
 * Returns a typed emergency: 'mental_health' | 'medical' | null
 */

// ── Mental Health Keywords ────────────────────────────────────────────────────
const SUICIDE_KEYWORDS = [
    'kill myself', 'want to die', 'suicide', 'end my life', 'self harm',
    'self-harm', 'no reason to live', 'better off dead', 'ending it all',
    'take my own life', "don't want to be here", 'worthless', 'hopeless',
    'hurt myself', 'overdose', 'jump off', 'hang myself', 'cut myself',
];

// ── Physical Emergency Keywords ───────────────────────────────────────────────
const CARDIAC_KEYWORDS = [
    'heart attack', 'crushing chest', 'severe chest pain', 'left arm pain',
];
const BREATHING_KEYWORDS = [
    'choking', 'suffocating', 'gasping', 'cannot breathe',
];
const STROKE_KEYWORDS = [
    'stroke', 'face drooping', 'arm weakness', 'speech difficulty', 'sudden numbness',
    'sudden confusion', 'vision loss', 'severe headache', 'slurred speech',
    "can't speak", 'facial drooping',
];
const SEIZURE_KEYWORDS = [
    'seizure', 'convulsion', 'fitting', 'epileptic attack', 'shaking uncontrollably',
    'spasm', 'blacking out', 'fell unconscious',
];
const UNCONSCIOUS_KEYWORDS = [
    'unconscious', 'passed out', 'fainted', 'unresponsive', 'collapsed',
    'lost consciousness', 'not responding', "won't wake up",
];
const BLEEDING_KEYWORDS = [
    'severe bleeding', 'bleeding heavily', "can't stop bleeding", 'blood everywhere',
    'cut deeply', 'hemorrhage', 'bleeding out',
];

// ── Thresholds ────────────────────────────────────────────────────────────────
const CRITICAL_PHYSICAL_THRESHOLD = 75;
const CRITICAL_MENTAL_THRESHOLD   = 75;

// ── Helper ───────────────────────────────────────────────────────────────────
function matchesKeywords(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

function extractMatched(text, keywordGroups) {
    const lower   = text.toLowerCase();
    const detected = [];
    for (const keywords of Object.values(keywordGroups)) {
        for (const kw of keywords) {
            if (lower.includes(kw.toLowerCase()) && !detected.includes(kw)) {
                detected.push(kw);
            }
        }
    }
    return detected;
}

// ── Main Detection ────────────────────────────────────────────────────────────
/**
 * Detects emergency conditions from conversation state.
 *
 * @param {Object} conversationState
 * @param {string}  conversationState.message           - Latest user message
 * @param {string}  [conversationState.fullHistory]     - Concatenated history
 * @param {number}  [conversationState.physicalRiskScore]
 * @param {number}  [conversationState.mentalRiskScore]
 * @param {number}  [conversationState.riskScore]       - Legacy combined score
 *
 * @returns {{
 *   isEmergency:      boolean,
 *   emergencyType:    'mental_health' | 'medical' | null,
 *   type:             string,
 *   severity:         string,
 *   reason:           string,
 *   detectedSymptoms: string[]
 * }}
 */
function detectEmergency(conversationState = {}) {
    const {
        message = '',
        fullHistory = '',
        physicalRiskScore,
        mentalRiskScore,
        riskScore, // legacy fallback
    } = conversationState;

    const combinedText = `${message} ${fullHistory}`;

    // ── 1. Mental Health / Suicidal Intent (always highest priority) ──────────
    if (matchesKeywords(combinedText, SUICIDE_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'mental_health',
            type:             'suicide',
            severity:         'critical',
            reason:           'Suicidal intent or self-harm language detected in conversation.',
            detectedSymptoms: extractMatched(combinedText, { suicide: SUICIDE_KEYWORDS }),
        };
    }

    // ── 2. Mental risk score threshold ────────────────────────────────────────
    const mentalScore = mentalRiskScore ?? (riskScore ?? 0);
    if (mentalScore >= CRITICAL_MENTAL_THRESHOLD) {
        return {
            isEmergency:      true,
            emergencyType:    'mental_health',
            type:             'mental_health',
            severity:         mentalScore >= 90 ? 'critical' : 'high',
            reason:           `Mental health risk score of ${mentalScore}/100 indicates a crisis state.`,
            detectedSymptoms: extractMatched(combinedText, { suicide: SUICIDE_KEYWORDS }),
        };
    }

    // ── 3. Cardiac ────────────────────────────────────────────────────────────
    if (matchesKeywords(combinedText, CARDIAC_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'cardiac',
            severity:         'critical',
            reason:           'Severe cardiac symptoms explicitly reported.',
            detectedSymptoms: extractMatched(combinedText, { cardiac: CARDIAC_KEYWORDS }),
        };
    }

    // ── 4. Stroke ─────────────────────────────────────────────────────────────
    if (matchesKeywords(combinedText, STROKE_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'stroke',
            severity:         'critical',
            reason:           'Stroke symptoms detected — potential neurological emergency.',
            detectedSymptoms: extractMatched(combinedText, { stroke: STROKE_KEYWORDS }),
        };
    }

    // ── 5. Seizure ────────────────────────────────────────────────────────────
    if (matchesKeywords(combinedText, SEIZURE_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'seizure',
            severity:         'critical',
            reason:           'Seizure or convulsion described.',
            detectedSymptoms: extractMatched(combinedText, { seizure: SEIZURE_KEYWORDS }),
        };
    }

    // ── 6. Unconsciousness ────────────────────────────────────────────────────
    if (matchesKeywords(combinedText, UNCONSCIOUS_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'critical',
            severity:         'critical',
            reason:           'Loss of consciousness or unresponsiveness described.',
            detectedSymptoms: extractMatched(combinedText, { unconscious: UNCONSCIOUS_KEYWORDS }),
        };
    }

    // ── 7. Severe Bleeding ────────────────────────────────────────────────────
    if (matchesKeywords(combinedText, BLEEDING_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'trauma',
            severity:         'critical',
            reason:           'Severe or uncontrolled bleeding described.',
            detectedSymptoms: extractMatched(combinedText, { bleeding: BLEEDING_KEYWORDS }),
        };
    }

    // ── 8. Severe Breathing ───────────────────────────────────────────────────
    if (matchesKeywords(combinedText, BREATHING_KEYWORDS)) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'breathing',
            severity:         'critical',
            reason:           'Severe respiratory distress explicitly reported.',
            detectedSymptoms: extractMatched(combinedText, { breathing: BREATHING_KEYWORDS }),
        };
    }

    // ── 9. Physical risk score threshold ─────────────────────────────────────
    const physScore = physicalRiskScore ?? (riskScore ?? 0);
    if (physScore >= CRITICAL_PHYSICAL_THRESHOLD) {
        return {
            isEmergency:      true,
            emergencyType:    'medical',
            type:             'critical',
            severity:         physScore >= 90 ? 'critical' : 'high',
            reason:           `Physical health risk score of ${physScore}/100 exceeds critical threshold.`,
            detectedSymptoms: extractMatched(combinedText, {
                cardiac:     CARDIAC_KEYWORDS,
                breathing:   BREATHING_KEYWORDS,
                stroke:      STROKE_KEYWORDS,
                seizure:     SEIZURE_KEYWORDS,
                unconscious: UNCONSCIOUS_KEYWORDS,
                bleeding:    BLEEDING_KEYWORDS,
            }),
        };
    }

    // ── 10. No emergency ─────────────────────────────────────────────────────
    return {
        isEmergency:      false,
        emergencyType:    null,
        type:             null,
        severity:         null,
        reason:           null,
        detectedSymptoms: [],
    };
}

module.exports = { detectEmergency };
