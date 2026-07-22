import { TimelineRepository } from "../repositories/timeline.repository";
import { TimelineEvent, TimelineEventType, TimelineQuery, PaginatedTimeline } from "../types/timeline.type";

const logTitleByStatus: Record<string, string> = {
  taken: "taken",
  skipped: "skipped",
};

const logTypeByStatus: Record<string, TimelineEventType> = {
  taken: "medicine_taken",
  skipped: "medicine_skipped",
};

const toDateKey = (d: Date) => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

export const TimelineService = {
  async getTimeline(userId: string, query: TimelineQuery): Promise<PaginatedTimeline> {
    const range = { from: query.from, to: query.to };

    const [
      logs,
      medicinesAdded,
      activeMedicines,
      prescriptions,
      appointments,
      reminderSnoozeLogs,
      emergencyContacts,
      conversations,
      user,
    ] = await Promise.all([
      TimelineRepository.findMedicineLogs(userId, range),
      TimelineRepository.findMedicinesAdded(userId, range),
      TimelineRepository.findActiveMedicines(userId),
      TimelineRepository.findPrescriptions(userId, range),
      TimelineRepository.findAppointments(userId),
      TimelineRepository.findSnoozedReminderLogs(userId),
      TimelineRepository.findEmergencyContacts(userId, range),
      TimelineRepository.findConversations(userId, range),
      TimelineRepository.findUserById(userId),
    ]);

    const medicineIds = [...new Set(logs.map((log) => log.medicineId))];
    const medicines = await TimelineRepository.findMedicinesByIds(medicineIds);
    const medicineNameById = new Map(medicines.map((m) => [m._id.toString(), m.name]));

    const reminderIds = [...new Set(reminderSnoozeLogs.map((log) => log.reminderId))];
    const reminders = await TimelineRepository.findRemindersByIds(reminderIds);
    const reminderTitleById = new Map(reminders.map((r) => [r._id.toString(), r.title]));

    const events: TimelineEvent[] = [];

    // Medicine taken / skipped — real logs. Also records which scheduled doses are
    // already accounted for, so the "missed" derivation below doesn't re-flag them.
    const loggedKeys = new Set<string>();
    for (const log of logs) {
      loggedKeys.add(`${log.medicineId}|${toDateKey(log.takenAt)}|${log.scheduledTime}`);
      const eventType = logTypeByStatus[log.status];
      if (!eventType) continue;
      const name = medicineNameById.get(log.medicineId) || "Medicine";
      events.push({
        id: `log-${log._id.toString()}`,
        type: eventType,
        title: `${name} — ${logTitleByStatus[log.status]}`,
        description: `Scheduled for ${log.scheduledTime}`,
        date: log.takenAt.toISOString(),
        refId: log.medicineId,
      });
    }

    // Medicine missed — there's no stored "missed" record, so it's derived: any scheduled
    // dose whose time has already passed with no taken/skipped log counts as missed.
    // Bounded to 90 days back (or the query range, whichever is narrower) to keep this cheap.
    const now = new Date();
    const defaultLookback = new Date();
    defaultLookback.setDate(defaultLookback.getDate() - 90);
    const missedRangeStart = range.from && range.from > defaultLookback ? range.from : defaultLookback;
    const missedRangeEnd = range.to && range.to < now ? range.to : now;
    const storedDayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    for (let d = new Date(missedRangeStart); d <= missedRangeEnd; d.setDate(d.getDate() + 1)) {
      const dayKey = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      for (const medicine of activeMedicines) {
        if (medicine.frequency !== "daily" && medicine.frequency !== "weekly") continue;
        const startKey = storedDayKey(new Date(medicine.startDate));
        const endKey = medicine.endDate ? storedDayKey(new Date(medicine.endDate)) : null;
        if (dayKey < startKey || (endKey !== null && dayKey > endKey)) continue;

        for (const time of medicine.times) {
          const [hours, minutes] = time.split(":").map(Number);
          const scheduledAt = new Date(d);
          scheduledAt.setHours(hours || 0, minutes || 0, 0, 0);
          if (scheduledAt > now) continue;

          const key = `${medicine._id.toString()}|${toDateKey(d)}|${time}`;
          if (loggedKeys.has(key)) continue;

          events.push({
            id: `missed-${key}`,
            type: "medicine_missed",
            title: `${medicine.name} — missed`,
            description: `Scheduled for ${time}`,
            date: scheduledAt.toISOString(),
            refId: medicine._id.toString(),
          });
        }
      }
    }

    for (const medicine of medicinesAdded) {
      events.push({
        id: `medicine-${medicine._id.toString()}`,
        type: "medicine_added",
        title: `Medicine added: ${medicine.name}`,
        description: `${medicine.dosage} · ${medicine.frequency}`,
        date: medicine.createdAt.toISOString(),
        refId: medicine._id.toString(),
      });
    }

    for (const log of reminderSnoozeLogs) {
      const title = reminderTitleById.get(log.reminderId) || "Reminder";
      events.push({
        id: `reminder-log-${log._id.toString()}`,
        type: "reminder_snoozed",
        title: `${title} — snoozed`,
        description: `For ${log.date}`,
        date: (log as any).updatedAt.toISOString(),
        refId: log.reminderId,
      });
    }

    for (const prescription of prescriptions) {
      events.push({
        id: `prescription-${prescription._id.toString()}`,
        type: "prescription_uploaded",
        title: `Prescription uploaded: ${prescription.title}`,
        description: [prescription.doctorName, prescription.medicines.join(", ")]
          .filter(Boolean)
          .join(" · ") || undefined,
        date: prescription.createdAt.toISOString(),
        refId: prescription._id.toString(),
      });
    }

    for (const appointment of appointments) {
      events.push({
        id: `appointment-created-${appointment._id.toString()}`,
        type: "appointment_created",
        title: `Appointment scheduled with ${appointment.doctorName}`,
        description: appointment.purpose,
        date: appointment.createdAt.toISOString(),
        refId: appointment._id.toString(),
      });

      if (appointment.status === "completed") {
        events.push({
          id: `appointment-completed-${appointment._id.toString()}`,
          type: "appointment_completed",
          title: `Appointment completed with ${appointment.doctorName}`,
          description: appointment.purpose,
          date: appointment.updatedAt.toISOString(),
          refId: appointment._id.toString(),
        });
      }
    }

    for (const contact of emergencyContacts) {
      events.push({
        id: `emergency-contact-${contact._id.toString()}`,
        type: "emergency_contact_added",
        title: `Emergency contact added: ${contact.name}`,
        description: contact.relationship,
        date: (contact as any).createdAt.toISOString(),
        refId: contact._id.toString(),
      });
    }

    for (const conversation of conversations) {
      events.push({
        id: `conversation-${conversation._id.toString()}`,
        type: "ai_conversation",
        title: `AI conversation: ${conversation.title}`,
        date: conversation.createdAt.toISOString(),
        refId: conversation._id.toString(),
      });
    }

    // Best-effort: no dedicated profile-change history exists, so a single
    // synthetic event is derived from the gap between createdAt and updatedAt.
    if (user?.createdAt && user?.updatedAt && user.updatedAt.getTime() - user.createdAt.getTime() > 60_000) {
      events.push({
        id: `profile-${user._id.toString()}`,
        type: "profile_updated",
        title: "Profile updated",
        date: user.updatedAt.toISOString(),
        refId: user._id.toString(),
      });
    }

    if (user?.passwordChangedAt) {
      events.push({
        id: `password-${user._id.toString()}-${user.passwordChangedAt.getTime()}`,
        type: "password_changed",
        title: "Password changed",
        date: user.passwordChangedAt.toISOString(),
        refId: user._id.toString(),
      });
    }

    // Appointment/reminder events aren't pre-filtered by range at the DB level (their
    // "created" and "completed" dates can diverge from a single query field), so the
    // range is enforced once here, uniformly, across every event type.
    const inRange = (dateStr: string) => {
      const t = new Date(dateStr).getTime();
      if (query.from && t < query.from.getTime()) return false;
      if (query.to && t > query.to.getTime()) return false;
      return true;
    };

    const rangeFiltered = events.filter((event) => inRange(event.date));
    const filtered = query.types?.length
      ? rangeFiltered.filter((event) => query.types!.includes(event.type))
      : rangeFiltered;

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / query.pageSize), 1);
    const start = (query.page - 1) * query.pageSize;
    const items = filtered.slice(start, start + query.pageSize);

    return {
      items,
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages,
      hasMore: query.page < totalPages,
    };
  },
};
