const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
    const token = process.env.TELEGRAM_REMINDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return null;
    if (!bot) {
        bot = new TelegramBot(token, { polling: false });
    }
    return bot;
}

function getChatId() {
    return process.env.TELEGRAM_REMINDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
}

function formatReminderMessage(reminder, patient) {
    const patientName = patient?.user
        ? `${patient.user.firstName || ''} ${patient.user.lastName || ''}`.trim()
        : patient?.name || 'Patient';

    const when = reminder.scheduledAt ? new Date(reminder.scheduledAt) : new Date();
    const whenText = when.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const titleLine = reminder.medicationName
        ? `Medication: ${reminder.medicationName}`
        : `Reminder: ${reminder.title || 'Medication reminder'}`;

    const doseLine = reminder.medicationDose ? `Dose: ${reminder.medicationDose}` : '';
    const instructionsLine = reminder.medicationInstructions ? `Instructions: ${reminder.medicationInstructions}` : '';

    return [
        'VITALPATH MEDICATION REMINDER',
        '------------------------------',
        `Patient: ${patientName || 'Patient'}`,
        titleLine,
        doseLine,
        instructionsLine,
        `Time: ${whenText}`,
    ].filter(Boolean).join('\n');
}

async function sendMedicationReminder({ reminder, patient }) {
    const chatId = getChatId();
    const telegramBot = getBot();

    if (!chatId) {
        return { success: false, error: 'TELEGRAM_REMINDER_CHAT_ID or TELEGRAM_CHAT_ID not configured.' };
    }

    if (!telegramBot) {
        return { success: false, error: 'TELEGRAM_REMINDER_BOT_TOKEN or TELEGRAM_BOT_TOKEN not configured.' };
    }

    const message = formatReminderMessage(reminder, patient);

    try {
        const sent = await telegramBot.sendMessage(chatId, message, { disable_web_page_preview: true });
        return { success: true, messageId: sent.message_id };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

module.exports = { sendMedicationReminder };
