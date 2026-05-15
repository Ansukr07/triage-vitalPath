const Reminder = require('../models/Reminder');
const { sendMedicationReminder } = require('./telegramReminderService');

async function dispatchDueMedicationReminders({ windowMinutes = 5, lookbackMinutes = 60 } = {}) {
    const now = new Date();
    const windowStart = new Date(now.getTime() - lookbackMinutes * 60 * 1000);
    const windowEnd = new Date(now.getTime() + windowMinutes * 60 * 1000);

    const reminders = await Reminder.find({
        type: 'medication',
        status: 'upcoming',
        telegramSent: false,
        scheduledAt: { $gte: windowStart, $lte: windowEnd },
    }).populate({
        path: 'patient',
        populate: { path: 'user', select: 'firstName lastName' },
    });

    const results = [];

    for (const reminder of reminders) {
        const result = await sendMedicationReminder({ reminder, patient: reminder.patient });

        if (result.success) {
            reminder.telegramSent = true;
            reminder.telegramMessageId = result.messageId;
            reminder.telegramError = undefined;
        } else {
            reminder.telegramError = result.error;
        }

        await reminder.save();
        results.push({ reminderId: reminder._id.toString(), ...result });
    }

    return results;
}

function shouldStartDispatcher() {
    const hasToken = Boolean(process.env.TELEGRAM_REMINDER_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN);
    const hasChatId = Boolean(process.env.TELEGRAM_REMINDER_CHAT_ID || process.env.TELEGRAM_CHAT_ID);
    return hasToken && hasChatId;
}

function startReminderDispatcher() {
    if (!shouldStartDispatcher()) {
        console.log('[ReminderDispatch] Telegram reminders disabled. Missing bot token or chat id.');
        return null;
    }

    const intervalMs = Number.parseInt(process.env.REMINDER_DISPATCH_INTERVAL_MS || '60000', 10);
    console.log(`[ReminderDispatch] Telegram reminder dispatcher running every ${intervalMs}ms.`);

    const run = () => {
        dispatchDueMedicationReminders().catch((err) => {
            console.error('[ReminderDispatch] Failed to dispatch reminders:', err.message);
        });
    };

    run();
    return setInterval(run, intervalMs);
}

module.exports = { dispatchDueMedicationReminders, startReminderDispatcher };
