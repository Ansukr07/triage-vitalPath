/**
 * telegramAlertService.js
 * Sends structured emergency alerts via the Telegram Bot API.
 * Supports dual physical / mental health emergency types.
 */

const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
    if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
    return bot;
}

// ── Severity emoji map ────────────────────────────────────────────────────────
const severityEmoji = {
    critical: '🔴',
    high:     '🟠',
    moderate: '🟡',
    stable:   '🟢',
};

// ── Emergency type label map ──────────────────────────────────────────────────
const emergencyTypeLabel = {
    // Mental health types
    suicide:       '🧠 Mental Health Crisis — Suicidal Intent',
    mental_health: '🧠 Mental Health Emergency',
    // Medical/physical types
    cardiac:       '🫀 Cardiac Emergency',
    stroke:        '🧠 Stroke / Neurological Emergency',
    seizure:       '⚡ Seizure / Convulsion',
    breathing:     '🫁 Respiratory Emergency',
    trauma:        '🩸 Severe Trauma / Bleeding',
    critical:      '🚨 Critical Medical Emergency',
};

// ── Format Telegram message ──────────────────────────────────────────────────
function formatAlertMessage(data) {
    const {
        patient,
        emergencyType,
        emergencyCategory,   // 'mental_health' | 'medical'
        severity,
        reason,
        symptoms,
        conversationSummary,
        location,
        physicalRiskScore,
        mentalRiskScore,
        riskScore,           // legacy fallback
        timestamp,
    } = data;

    const emoji     = severityEmoji[severity] || '🔴';
    const typeLabel = emergencyTypeLabel[emergencyType] || '🚨 Medical Emergency';
    const ts        = timestamp
        ? new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        : new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const symptomsText = Array.isArray(symptoms) && symptoms.length > 0
        ? symptoms.map(s => `  • ${s}`).join('\n')
        : '  • Not specified';

    const locationText = location?.latitude && location?.longitude
        ? `https://maps.google.com/?q=${location.latitude},${location.longitude}`
        : 'Location not available';

    const patientName = patient?.name || 'Unknown Patient';
    const patientId   = patient?.id   || 'N/A';

    // Build risk score section based on what's available
    let riskScoreLines = '';
    if (physicalRiskScore !== undefined && mentalRiskScore !== undefined) {
        riskScoreLines = `🫀 *Physical Risk Score:* ${physicalRiskScore}/100\n🧠 *Mental Health Risk Score:* ${mentalRiskScore}/100`;
    } else if (riskScore !== undefined) {
        riskScoreLines = `📊 *Risk Score:* ${riskScore}/100`;
    }

    // Header differs for mental vs medical alerts
    const headerLine = emergencyCategory === 'mental_health'
        ? '🚨 *VITALPATH MENTAL HEALTH ALERT*'
        : '🚨 *VITALPATH MEDICAL EMERGENCY ALERT*';

    return `
${headerLine}
━━━━━━━━━━━━━━━━━━━━━━━━━━━

${emoji} *Risk Level:* ${severity?.toUpperCase() || 'CRITICAL'}
${riskScoreLines}

👤 *Patient:* ${patientName}
🆔 *Patient ID:* \`${patientId}\`

🏥 *Emergency Type:*
${typeLabel}

⚠️ *Trigger Reason:*
${reason || 'Critical condition detected'}

🩺 *Detected Signals:*
${symptomsText}

📋 *Conversation Summary:*
${conversationSummary || 'No summary available.'}

📍 *Location:*
${locationText}

🕐 *Timestamp:*
${ts}

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚕️ _This is a preliminary risk assessment. Do NOT contact emergency services based solely on this alert. Verify with the patient directly._
`.trim();
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Sends a Telegram emergency alert.
 * @param {Object} data - All emergency context data
 * @returns {Promise<{success: boolean, messageId?: number, error?: string}>}
 */
async function sendEmergencyAlert(data) {
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!chatId) {
        console.warn('[TelegramAlert] TELEGRAM_CHAT_ID not set — skipping alert.');
        return { success: false, error: 'TELEGRAM_CHAT_ID not configured.' };
    }

    const telegramBot = getBot();
    if (!telegramBot) {
        console.warn('[TelegramAlert] TELEGRAM_BOT_TOKEN not set — skipping alert.');
        return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured.' };
    }

    const message = formatAlertMessage(data);

    try {
        const category = data.emergencyCategory || data.emergencyType || 'medical';
        console.log(`[TelegramAlert] Sending ${category} alert for patient: ${data.patient?.name} | type: ${data.emergencyType}`);
        const sent = await telegramBot.sendMessage(chatId, message, {
            parse_mode: 'Markdown',
            disable_web_page_preview: false,
        });
        console.log(`[TelegramAlert] ✅ Alert sent. Message ID: ${sent.message_id}`);
        return { success: true, messageId: sent.message_id };
    } catch (err) {
        console.error('[TelegramAlert] ❌ Failed to send alert:', err.message);
        return { success: false, error: err.message };
    }
}

module.exports = { sendEmergencyAlert, formatAlertMessage };
