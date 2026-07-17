import { TimelineRepository } from "../repositories/timeline.repository";
import { TimelineEvent, TimelineEventType, TimelineQuery, PaginatedTimeline } from "../types/timeline.type";

const logTitleByStatus: Record<string, string> = {
  taken: "taken",
  skipped: "skipped",
  missed: "missed",
};

const logTypeByStatus: Record<string, TimelineEventType> = {
  taken: "medicine_taken",
  skipped: "medicine_skipped",
  missed: "medicine_missed",
};

export const TimelineService = {
  async getTimeline(userId: string, query: TimelineQuery): Promise<PaginatedTimeline> {
    const range = { from: query.from, to: query.to };

    const [logs, medicinesAdded, prescriptions, appointments, conversations, user] = await Promise.all([
      TimelineRepository.findMedicineLogs(userId, range),
      TimelineRepository.findMedicinesAdded(userId, range),
      TimelineRepository.findPrescriptions(userId, range),
      TimelineRepository.findAppointments(userId, range),
      TimelineRepository.findConversations(userId, range),
      TimelineRepository.findUserById(userId),
    ]);

    const medicineIds = [...new Set(logs.map((log) => log.medicineId))];
    const medicines = await TimelineRepository.findMedicinesByIds(medicineIds);
    const medicineNameById = new Map(medicines.map((m) => [m._id.toString(), m.name]));

    const events: TimelineEvent[] = [];

    for (const log of logs) {
      const name = medicineNameById.get(log.medicineId) || "Medicine";
      events.push({
        id: `log-${log._id.toString()}`,
        type: logTypeByStatus[log.status] ?? "medicine_taken",
        title: `${name} — ${logTitleByStatus[log.status] ?? log.status}`,
        description: `Scheduled for ${log.scheduledTime}`,
        date: log.takenAt.toISOString(),
        refId: log.medicineId,
      });
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
        id: `appointment-${appointment._id.toString()}`,
        type: "appointment",
        title: `Appointment with ${appointment.doctorName}`,
        description: [appointment.status, appointment.purpose].filter(Boolean).join(" · "),
        date: appointment.appointmentDate.toISOString(),
        refId: appointment._id.toString(),
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

    const filtered = query.types?.length
      ? events.filter((event) => query.types!.includes(event.type))
      : events;

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
