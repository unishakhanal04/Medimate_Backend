import { MedicineService } from "./medicine.services";
import { AppointmentService } from "./appointment.services";
import { PrescriptionService } from "./prescription.services";
import { UserRepository } from "../repositories/user.repository";
import { NotificationItem, NotificationsResult } from "../types/notification.type";

const RECENT_WINDOW_DAYS = 7;

export const NotificationService = {
  async getNotifications(userId: string): Promise<NotificationsResult> {
    const [todayMedicines, allMedicines, upcomingAppointments, prescriptions, refillAlerts, user] = await Promise.all([
      MedicineService.getTodayMedicines(userId),
      MedicineService.getMedicinesByUserId(userId),
      AppointmentService.getUpcomingAppointments(userId),
      PrescriptionService.getPrescriptionsByUserId(userId),
      MedicineService.getRefillAlerts(userId),
      UserRepository.findById(userId),
    ]);

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const recentCutoff = new Date();
    recentCutoff.setDate(recentCutoff.getDate() - RECENT_WINDOW_DAYS);

    const lastSeen = user?.notificationsLastSeenAt ?? null;
    const isUnread = (date: Date) => !lastSeen || date > lastSeen;

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const items: NotificationItem[] = [];

    for (const medicine of allMedicines) {
      if (medicine.createdAt >= recentCutoff) {
        items.push({
          id: `medicine-added-${medicine._id.toString()}`,
          type: "medicine_added",
          title: "Medicine added",
          message: `${medicine.name} (${medicine.dosage}) was added to your medicines.`,
          date: medicine.createdAt.toISOString(),
          read: !isUnread(medicine.createdAt),
          refId: medicine._id.toString(),
        });
      }
    }

    // Medicine missed — today's doses whose scheduled time has passed with no log.
    // Dated at the dose's own scheduled time (not the request time) so "mark all as
    // read" actually sticks; a later dose missed today will still show up as new.
    for (const med of todayMedicines) {
      if (med.status === "pending" && med.time < currentTime) {
        const [hours, minutes] = med.time.split(":").map(Number);
        const missedAt = new Date(now);
        missedAt.setHours(hours, minutes, 0, 0);
        items.push({
          id: `missed-${med._id}-${med.time}`,
          type: "medicine_missed",
          title: "Medicine missed",
          message: `${med.name} (${med.dosage}) — scheduled for ${med.time}`,
          date: missedAt.toISOString(),
          read: !isUnread(missedAt),
          refId: med._id,
        });
      }
    }

    // Appointment tomorrow — dated at the start of today (when this notice first
    // becomes true) rather than the request time, so it can be marked read.
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toDateString();
    for (const appt of upcomingAppointments) {
      if (new Date(appt.appointmentDate).toDateString() === tomorrowDateStr) {
        items.push({
          id: `appt-tomorrow-${appt._id.toString()}`,
          type: "appointment_tomorrow",
          title: "Appointment tomorrow",
          message: `${appt.purpose} with ${appt.doctorName} at ${appt.appointmentTime}`,
          date: startOfToday.toISOString(),
          read: !isUnread(startOfToday),
          refId: appt._id.toString(),
        });
      }
    }

    // Prescription uploaded — recent
    for (const prescription of prescriptions) {
      if (prescription.createdAt >= recentCutoff) {
        items.push({
          id: `prescription-${prescription._id.toString()}`,
          type: "prescription_uploaded",
          title: "Prescription uploaded",
          message: prescription.title,
          date: prescription.createdAt.toISOString(),
          read: !isUnread(prescription.createdAt),
          refId: prescription._id.toString(),
        });
      }
    }

    // Low medicine stock — dated at the start of today rather than the request
    // time, so it can be marked read; it'll surface again if still low tomorrow.
    for (const alert of refillAlerts) {
      items.push({
        id: `low-stock-${alert._id}`,
        type: "low_stock",
        title: "Low medicine stock",
        message: `${alert.name} — ${alert.quantity} tablet${alert.quantity === 1 ? "" : "s"} left`,
        date: startOfToday.toISOString(),
        read: !isUnread(startOfToday),
        refId: alert._id,
      });
    }

    // Password changed — recent
    if (user?.passwordChangedAt && user.passwordChangedAt >= recentCutoff) {
      items.push({
        id: `password-changed-${user.passwordChangedAt.getTime()}`,
        type: "password_changed",
        title: "Password changed",
        message: "Your account password was updated.",
        date: user.passwordChangedAt.toISOString(),
        read: !isUnread(user.passwordChangedAt),
      });
    }

    if (user?.profileUpdatedAt && user.profileUpdatedAt >= recentCutoff) {
      items.push({
        id: `profile-updated-${user.profileUpdatedAt.getTime()}`,
        type: "profile_updated",
        title: "Profile updated",
        message: "Your profile information was updated.",
        date: user.profileUpdatedAt.toISOString(),
        read: !isUnread(user.profileUpdatedAt),
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      items,
      unreadCount: items.filter((item) => !item.read).length,
    };
  },

  async markAllSeen(userId: string): Promise<{ notificationsLastSeenAt: string }> {
    const now = new Date();
    await UserRepository.update(userId, { notificationsLastSeenAt: now });
    return { notificationsLastSeenAt: now.toISOString() };
  },
};
