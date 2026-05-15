const axios = require('axios');

/**
 * ML Risk Scoring Service
 * ─────────────────────────────────────────────────────────────────
 * Calls an external ML microservice (Python/FastAPI) for probability-
 * based risk scoring. If the service is unavailable, gracefully
 * falls back to rule-engine-only mode.
 *
 * Expected ML Service response:
 * {
 *   "priority": "moderate",
 *   "probability_map": { "stable": 0.1, "moderate": 0.55, "high": 0.3, "critical": 0.05 },
 *   "confidence": 0.82,
 *   "model_version": "v1.2.0"
 * }
 * ─────────────────────────────────────────────────────────────────
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000/predict';
const ML_TIMEOUT_MS = 5000; // 5 second timeout

/**
 * Call ML service with patient features
 * @param {Object} features - normalized patient features for ML model
 * @returns {Object} ML result with available flag
 */
async function getMLRiskScore(features, clinicalEmbeddings = []) {
    try {
        const payload = { ...features };
        if (clinicalEmbeddings.length > 0) {
            payload.clinical_embeddings = clinicalEmbeddings;
        }

        const response = await axios.post(ML_SERVICE_URL, payload, {
            timeout: ML_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });

        const data = response.data;

        return {
            available: true,
            priority: data.priority,
            probabilityMap: {
                stable: data.probability_map?.stable ?? 0,
                moderate: data.probability_map?.moderate ?? 0,
                high: data.probability_map?.high ?? 0,
                critical: data.probability_map?.critical ?? 0,
            },
            confidence: data.confidence ?? 0,
            modelVersion: data.model_version ?? 'unknown',
        };
    } catch (err) {
        console.warn('⚠️  ML service unavailable. Using rule-engine only.', err.message);
        return {
            available: false,
            priority: null,
            probabilityMap: { stable: 0, moderate: 0, high: 0, critical: 0 },
            confidence: 0,
            modelVersion: null,
        };
    }
}

/**
 * Build the normalized feature vector for the ML model
 * from raw vitals and symptoms
 */
function buildMLFeatures(vitals = {}, symptoms = []) {
    const avgSeverity = symptoms.length
        ? symptoms.reduce((sum, s) => sum + (s.severity || 0), 0) / symptoms.length
        : 0;

    const maxSeverity = symptoms.length
        ? Math.max(...symptoms.map((s) => s.severity || 0))
        : 0;

    return {
        oxygen_saturation: vitals.oxygenSaturation ?? -1,
        heart_rate: vitals.heartRate ?? -1,
        systolic_bp: vitals.bloodPressureSystolic ?? -1,
        diastolic_bp: vitals.bloodPressureDiastolic ?? -1,
        temperature: vitals.temperature ?? -1,
        respiratory_rate: vitals.respiratoryRate ?? -1,
        blood_glucose: vitals.bloodGlucose ?? -1,
        symptom_count: symptoms.length,
        avg_symptom_severity: avgSeverity,
        max_symptom_severity: maxSeverity,
        has_chest_pain: symptoms.some((s) => s.name?.toLowerCase().includes('chest pain')) ? 1 : 0,
        has_breathing_difficulty: symptoms.some((s) => s.name?.toLowerCase().includes('breath')) ? 1 : 0,
        has_loss_of_consciousness: symptoms.some((s) => s.name?.toLowerCase().includes('consciousness')) ? 1 : 0,
    };
}

module.exports = { getMLRiskScore, buildMLFeatures };
