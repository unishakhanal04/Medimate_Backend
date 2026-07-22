import { MedicineModel, MedicineLogModel } from "../models/medicine.model";
import { PrescriptionModel } from "../models/prescription.model";
import { AppointmentModel } from "../models/appointment.model";
import { ConversationModel } from "../models/conversation.model";
import { UserModel } from "../models/user.model";
import { ReminderModel } from "../models/reminder.model";
import { ReminderLogModel } from "../models/reminderLog.model";
import { EmergencyContactModel } from "../models/emergency-contact.model";

interface DateRange {
  from?: Date;
  to?: Date;
}

const dateFilter = (field: string, range: DateRange) => {
  if (!range.from && !range.to) return {};
  const bounds: Record<string, Date> = {};
  if (range.from) bounds.$gte = range.from;
  if (range.to) bounds.$lte = range.to;
  return { [field]: bounds };
};

export const TimelineRepository = {
  async findMedicineLogs(userId: string, range: DateRange) {
    return MedicineLogModel.find({ userId, ...dateFilter("takenAt", range) }).sort({ takenAt: -1 });
  },

  async findMedicinesByIds(ids: string[]) {
    if (!ids.length) return [];
    return MedicineModel.find({ _id: { $in: ids } });
  },

  async findMedicinesAdded(userId: string, range: DateRange) {
    return MedicineModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  async findActiveMedicines(userId: string) {
    return MedicineModel.find({ userId, status: "active" });
  },

  async findPrescriptions(userId: string, range: DateRange) {
    return PrescriptionModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  // Not date-filtered at the DB level: "created" and "completed" events derived from a
  // single appointment can land on very different dates, so range filtering happens once,
  // uniformly, on the final event list in TimelineService instead of here.
  async findAppointments(userId: string) {
    return AppointmentModel.find({ userId }).sort({ createdAt: -1 }).limit(300);
  },

  async findSnoozedReminderLogs(userId: string) {
    return ReminderLogModel.find({ userId, status: "snoozed" }).sort({ updatedAt: -1 }).limit(300);
  },

  async findRemindersByIds(ids: string[]) {
    if (!ids.length) return [];
    return ReminderModel.find({ _id: { $in: ids } });
  },

  async findEmergencyContacts(userId: string, range: DateRange) {
    return EmergencyContactModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  async findConversations(userId: string, range: DateRange) {
    return ConversationModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  async findUserById(userId: string) {
    return UserModel.findById(userId).select("createdAt updatedAt passwordChangedAt");
  },
};
