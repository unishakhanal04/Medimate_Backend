import { ReminderModel } from "../models/reminder.model";
import { PushService } from "./push.services";

const DAY_ABBREVIATIONS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CHECK_INTERVAL_MS = 60 * 1000;

// Guards against sending the same reminder twice in the same minute (e.g. if the
// interval timer drifts). Keyed by reminderId -> the "YYYY-MM-DD HH:MM" slot it
// last fired for. Resets naturally since old entries are just overwritten, and it's
// fine for this to reset on server restart — worst case is one reminder fires again.
const lastSentSlot = new Map<string, string>();

const currentSlot = () => {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { day: DAY_ABBREVIATIONS[now.getDay()], date, time, slotKey: `${date} ${time}` };
};

async function sendDueReminders() {
  const { day, time, slotKey } = currentSlot();

  try {
    const dueReminders = await ReminderModel.find({ enabled: true, time, days: day });

    for (const reminder of dueReminders) {
      const reminderId = reminder._id.toString();
      if (lastSentSlot.get(reminderId) === slotKey) continue;
      lastSentSlot.set(reminderId, slotKey);

      await PushService.sendToUser(reminder.userId, {
        title: `⏰ ${reminder.title}`,
        body: "It's time — open MediMate to mark it done.",
        url: "/user/reminders",
      });
    }
  } catch (err) {
    console.error("Reminder scheduler tick failed:", err);
  }
}

export const startReminderScheduler = () => {
  setInterval(sendDueReminders, CHECK_INTERVAL_MS);
};
