/**
 * Rule-Based Triage Engine
 * ─────────────────────────────────────────────────────────────────
 * PHYSICAL: hard threshold rules on vitals and symptoms.
 * MENTAL:   keyword/intensity scoring for mental health signals.
 *
 * Priority levels: 'stable' | 'moderate' | 'high' | 'critical'
 * Severity levels: 'LOW'    | 'MODERATE' | 'HIGH' | 'CRITICAL'
 * Score:           0–100    (higher = more urgent)
 *
 * IMPORTANT: Decision-SUPPORT tool only.
 * A licensed clinician must always review results.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Vital Sign Thresholds ────────────────────────────────────────────────
const VITAL_RULES = [
    {
        factor: 'Oxygen Saturation (SpO₂)', field: 'oxygenSaturation', unit: '%',
        rules: [
            { condition: (v) => v < 90,  priority: 'critical', score: 95, label: '< 90% — severe hypoxemia' },
            { condition: (v) => v >= 90 && v < 94, priority: 'high',     score: 70, label: '90–93% — moderate hypoxemia' },
            { condition: (v) => v >= 94 && v < 96, priority: 'moderate', score: 40, label: '94–95% — borderline low' },
        ],
    },
    {
        factor: 'Heart Rate', field: 'heartRate', unit: 'bpm',
        rules: [
            { condition: (v) => v > 150, priority: 'critical', score: 90, label: '> 150 bpm — severe tachycardia' },
            { condition: (v) => v < 40,  priority: 'critical', score: 90, label: '< 40 bpm — severe bradycardia' },
            { condition: (v) => v > 120 && v <= 150, priority: 'high', score: 65, label: '120–150 bpm — tachycardia' },
            { condition: (v) => v >= 40 && v < 50,   priority: 'high', score: 65, label: '40–50 bpm — bradycardia' },
            { condition: (v) => (v > 100 && v <= 120) || (v >= 50 && v < 60), priority: 'moderate', score: 35, label: 'borderline heart rate' },
        ],
    },
    {
        factor: 'Blood Pressure (Systolic)', field: 'bloodPressureSystolic', unit: 'mmHg',
        rules: [
            { condition: (v) => v >= 180, priority: 'critical', score: 92, label: '≥ 180 mmHg — hypertensive crisis' },
            { condition: (v) => v < 80,   priority: 'critical', score: 92, label: '< 80 mmHg — hypotensive shock' },
            { condition: (v) => v >= 160 && v < 180, priority: 'high', score: 68, label: '160–179 mmHg — stage 2 hypertension' },
            { condition: (v) => v >= 80  && v < 90,  priority: 'high', score: 68, label: '80–89 mmHg — hypotension' },
            { condition: (v) => v >= 140 && v < 160, priority: 'moderate', score: 38, label: '140–159 mmHg — stage 1 hypertension' },
        ],
    },
    {
        factor: 'Temperature', field: 'temperature', unit: '°C',
        rules: [
            { condition: (v) => v >= 40, priority: 'critical', score: 88, label: '≥ 40°C — hyperpyrexia' },
            { condition: (v) => v < 35,  priority: 'critical', score: 88, label: '< 35°C — hypothermia' },
            { condition: (v) => v >= 39 && v < 40, priority: 'high',     score: 62, label: '39–39.9°C — high fever' },
            { condition: (v) => v >= 38 && v < 39, priority: 'moderate', score: 35, label: '38–38.9°C — moderate fever' },
        ],
    },
    {
        factor: 'Respiratory Rate', field: 'respiratoryRate', unit: 'breaths/min',
        rules: [
            { condition: (v) => v > 30 || v < 8,       priority: 'critical', score: 88, label: 'severely abnormal respiratory rate' },
            { condition: (v) => v > 25 && v <= 30,     priority: 'high',     score: 65, label: '25–30 breaths/min — elevated' },
            { condition: (v) => v >= 8 && v < 12,      priority: 'moderate', score: 35, label: '8–11 breaths/min — low-normal' },
        ],
    },
    {
        factor: 'Blood Glucose', field: 'bloodGlucose', unit: 'mg/dL',
        rules: [
            { condition: (v) => v > 400, priority: 'critical', score: 86, label: '> 400 mg/dL — severe hyperglycemia' },
            { condition: (v) => v < 50,  priority: 'critical', score: 90, label: '< 50 mg/dL — severe hypoglycemia' },
            { condition: (v) => v > 250 && v <= 400, priority: 'high', score: 62, label: '250–400 mg/dL — high blood glucose' },
            { condition: (v) => v >= 50 && v < 70,   priority: 'high', score: 62, label: '50–69 mg/dL — hypoglycemia' },
        ],
    },
];

// ─── Physical Symptom Rules ───────────────────────────────────────────────
const CRITICAL_SYMPTOMS = [
    'chest pain', 'chest tightness', 'difficulty breathing', 'shortness of breath',
    'loss of consciousness', 'unconscious', 'seizure', 'stroke', 'paralysis',
    'severe bleeding', 'coughing blood', 'vomiting blood', 'severe head injury',
];
const HIGH_SYMPTOMS = [
    'severe abdominal pain', 'severe headache', 'sudden vision loss', 'sudden weakness',
    'high fever', 'persistent vomiting', 'signs of infection', 'severe allergic reaction',
    'fainting', 'dizziness', 'confusion', 'slurred speech',
];
const MODERATE_SYMPTOMS = [
    'nausea', 'vomiting', 'diarrhea', 'moderate pain', 'persistent cough',
    'ear pain', 'sore throat', 'urinary pain', 'joint pain', 'rash', 'swelling',
];

// ─── Mental Health Keyword Weights ───────────────────────────────────────
// Each entry: [keyword, score (0-100), reason label]
const MENTAL_WEIGHTS = [
    // CRITICAL — suicidal / self-harm (75–100)
    ['kill myself',        100, 'Explicit suicidal statement detected'],
    ['want to die',         95, 'Active suicidal ideation expressed'],
    ['end my life',         98, 'Suicidal intent language present'],
    ['take my own life',    98, 'Explicit suicidal intent expressed'],
    ['suicide',             92, 'Suicide mentioned directly'],
    ['suicidal',            90, 'Suicidal ideation present'],
    ['self harm',           88, 'Self-harm language detected'],
    ['self-harm',           88, 'Self-harm language detected'],
    ['hurt myself',         85, 'Self-harm intent expressed'],
    ['cut myself',          88, 'Self-harm language detected'],
    ['overdose',            90, 'Overdose mentioned — potential self-harm'],
    ['jump off',            92, 'Suicidal ideation expressed'],
    ['hang myself',         95, 'Explicit suicidal method mentioned'],
    ['no reason to live',   90, 'Severe hopelessness and suicidal ideation'],
    ['better off dead',     92, 'Suicidal ideation with hopelessness'],
    ['ending it all',       90, 'Suicidal ideation expressed'],
    ['don\'t want to be here', 85, 'Passive suicidal ideation expressed'],

    // HIGH — severe distress, hopelessness (51–74)
    ['worthless',           68, 'Severe negative self-perception (hopelessness indicator)'],
    ['hopeless',            72, 'Hopelessness — key depression/suicide risk factor'],
    ['no hope',             70, 'Hopelessness expressed'],
    ['nothing matters',     65, 'Emotional numbness / anhedonia expressed'],
    ['can\'t go on',        72, 'Severe distress — inability to cope'],
    ['give up',             62, 'Emotional withdrawal and surrender expressed'],
    ['can\'t take it',      60, 'Acute emotional distress expressed'],
    ['falling apart',       58, 'Severe psychological distress expressed'],
    ['breakdown',           60, 'Mental health crisis language'],
    ['can\'t cope',         62, 'Inability to cope expressed'],
    ['no one cares',        60, 'Social isolation and helplessness'],
    ['all alone',           55, 'Severe social isolation expressed'],
    ['trapped',             62, 'Feeling trapped — significant distress signal'],
    ['unbearable',          65, 'Extreme emotional pain expressed'],
    ['severe anxiety',      60, 'Severe anxiety reported'],
    ['panic attack',        58, 'Panic attack — acute anxiety event'],
    ['psychosis',           72, 'Psychotic episode or psychosis mentioned'],
    ['hallucinating',       70, 'Hallucinations reported — psychiatric emergency risk'],
    ['hearing voices',      72, 'Auditory hallucinations reported'],

    // MODERATE — depression/anxiety language (21–50)
    ['depressed',           42, 'Depression symptoms reported'],
    ['depression',          44, 'Depression mentioned'],
    ['anxious',             30, 'Anxiety symptoms present'],
    ['anxiety',             32, 'Anxiety mentioned'],
    ['sad all the time',    38, 'Persistent sadness — depression indicator'],
    ['can\'t sleep',        28, 'Insomnia — common depression/anxiety symptom'],
    ['not eating',          30, 'Appetite loss — common depression symptom'],
    ['lost interest',       38, 'Anhedonia — core depression symptom'],
    ['crying a lot',        35, 'Persistent tearfulness expressed'],
    ['overwhelmed',         30, 'Emotional overwhelm expressed'],
    ['stressed',            22, 'Stress symptoms present'],
    ['scared',              22, 'Fear response expressed'],
    ['afraid',              22, 'Fear response expressed'],
    ['exhausted emotionally', 32, 'Emotional exhaustion expressed'],
    ['mental health',       25, 'Mental health concern raised'],
    ['mood swings',         30, 'Mood instability reported'],
    ['irritable',           25, 'Irritability — common anxiety/depression symptom'],
];

// ─── Priority Ordering ────────────────────────────────────────────────────
const PRIORITY_RANK   = { stable: 0, moderate: 1, high: 2, critical: 3 };
const RANK_TO_PRIORITY = ['stable', 'moderate', 'high', 'critical'];

/** Score → severity label */
function scoreToSeverity(score) {
    if (score >= 75) return 'CRITICAL';
    if (score >= 51) return 'HIGH';
    if (score >= 21) return 'MODERATE';
    return 'LOW';
}

// ─────────────────────────────────────────────────────────────────────────
// PHYSICAL TRIAGE ENGINE
// ─────────────────────────────────────────────────────────────────────────
/**
 * @param {Object} vitals   - vital sign values
 * @param {Array}  symptoms - [{ name, severity (1-10), durationDays, frequency }]
 * @returns {{ priority, score, severity, reasoning, triggeredRules }}
 */
function runTriageEngine(vitals = {}, symptoms = []) {
    const reasoning      = [];
    const triggeredRules = [];
    let maxPriorityRank  = 0;
    let maxScore         = 0;

    // Check vitals
    for (const vitalDef of VITAL_RULES) {
        const value = vitals[vitalDef.field];
        if (value == null) continue;

        for (const rule of vitalDef.rules) {
            if (rule.condition(value)) {
                const rank = PRIORITY_RANK[rule.priority];
                if (rank >= maxPriorityRank) maxPriorityRank = rank;
                if (rule.score > maxScore) maxScore = rule.score;

                reasoning.push({
                    factor: vitalDef.factor,
                    value: `${value} ${vitalDef.unit}`,
                    threshold: rule.label,
                    contribution: rank >= 2 ? 'high' : 'medium',
                    source: 'rule_engine',
                });
                triggeredRules.push(`${vitalDef.factor}: ${rule.label}`);
                break;
            }
        }
    }

    // Check symptoms
    for (const symptom of symptoms) {
        const nameLower   = symptom.name.toLowerCase();
        let symPriority   = 'stable';
        let symScore      = 0;

        if (CRITICAL_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'critical'; symScore = 90;
        } else if (HIGH_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'high'; symScore = 65;
        } else if (MODERATE_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'moderate'; symScore = 35;
        }

        if (symptom.severity >= 8) {
            symScore = Math.min(100, symScore + 15);
            if (PRIORITY_RANK[symPriority] < PRIORITY_RANK['high']) symPriority = 'high';
        } else if (symptom.severity >= 6) {
            symScore = Math.min(100, symScore + 8);
        }
        if (symptom.durationDays && symptom.durationDays <= 1 && PRIORITY_RANK[symPriority] >= 1) {
            symScore = Math.min(100, symScore + 10);
        }
        if (symptom.frequency === 'constant' && PRIORITY_RANK[symPriority] >= 1) {
            symScore = Math.min(100, symScore + 5);
        }

        const rank = PRIORITY_RANK[symPriority];
        if (rank > 0) {
            if (rank >= maxPriorityRank) maxPriorityRank = rank;
            if (symScore > maxScore) maxScore = symScore;
            reasoning.push({
                factor: `Symptom: ${symptom.name}`,
                value: `Severity ${symptom.severity}/10, ${symptom.frequency}`,
                threshold: `Classified as ${symPriority}`,
                contribution: rank >= 2 ? 'high' : 'medium',
                source: 'rule_engine',
            });
            triggeredRules.push(`Symptom "${symptom.name}" — ${symPriority}`);
        }
    }

    const finalPriority = RANK_TO_PRIORITY[maxPriorityRank];
    const finalScore    = maxScore || 10;

    if (reasoning.length === 0) {
        reasoning.push({
            factor: 'Overall Assessment',
            value: 'All values within normal range',
            threshold: 'No critical thresholds exceeded',
            contribution: 'low',
            source: 'rule_engine',
        });
        triggeredRules.push('No critical rules triggered');
    }

    return {
        priority: finalPriority,
        score: finalScore,
        severity: scoreToSeverity(finalScore),
        reasoning,
        triggeredRules,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// MENTAL HEALTH ENGINE
// ─────────────────────────────────────────────────────────────────────────
/**
 * Score mental health risk from free text (chat messages, history).
 * Uses a weighted keyword table with explainable reasons.
 *
 * @param {string} text - combined user message + recent conversation history
 * @returns {{ score, severity, reasons, triggeredKeywords }}
 */
function runMentalHealthEngine(text = '') {
    const lower    = text.toLowerCase();
    const reasons  = [];
    const triggered = [];
    let maxScore   = 0;
    let totalScore = 0;
    let hitCount   = 0;
    const seen     = new Set();

    for (const [keyword, weight, reason] of MENTAL_WEIGHTS) {
        if (lower.includes(keyword) && !seen.has(keyword)) {
            seen.add(keyword);
            triggered.push(keyword);
            reasons.push(reason);
            totalScore += weight;
            hitCount++;
            if (weight > maxScore) maxScore = weight;
        }
    }

    // Blend: 70% max single-term weight + 30% mean across all hits
    let finalScore = 0;
    if (hitCount > 0) {
        const avgScore = totalScore / hitCount;
        finalScore = Math.round((maxScore * 0.70) + (avgScore * 0.30));
        finalScore = Math.min(100, Math.max(0, finalScore));
    }

    // Escalate if multiple moderate signals cluster together
    if (hitCount >= 3 && finalScore < 51) {
        finalScore = Math.min(100, finalScore + 10);
        reasons.push('Multiple co-occurring emotional distress signals detected');
    }

    if (reasons.length === 0) {
        reasons.push('No significant mental health risk indicators detected');
    }

    return {
        score: finalScore,
        severity: scoreToSeverity(finalScore),
        reasons,
        triggeredKeywords: triggered,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// MERGE UTILITIES
// ─────────────────────────────────────────────────────────────────────────
/**
 * Merge rule-engine and ML outputs → choose higher severity
 */
function mergePriorities(ruleResult, mlResult) {
    const ruleRank = PRIORITY_RANK[ruleResult.priority] ?? 0;
    const mlRank   = mlResult?.available ? (PRIORITY_RANK[mlResult.priority] ?? 0) : -1;

    if (!mlResult?.available) {
        return { finalPriority: ruleResult.priority, finalScore: ruleResult.score, source: 'rule_engine' };
    }
    if (ruleRank > mlRank) {
        return { finalPriority: ruleResult.priority, finalScore: ruleResult.score, source: 'rule_engine' };
    } else if (mlRank > ruleRank) {
        return { finalPriority: mlResult.priority, finalScore: Math.round(mlResult.probabilityMap[mlResult.priority] * 100), source: 'ml_model' };
    } else {
        return {
            finalPriority: RANK_TO_PRIORITY[ruleRank],
            finalScore: Math.max(ruleResult.score, Math.round((mlResult.probabilityMap[mlResult.priority] || 0) * 100)),
            source: 'tie',
        };
    }
}

module.exports = { runTriageEngine, runMentalHealthEngine, mergePriorities, PRIORITY_RANK, scoreToSeverity };
