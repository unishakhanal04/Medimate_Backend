import { MedicineModel, MedicineLogModel } from "../models/medicine.model";
import { PrescriptionModel } from "../models/prescription.model";
import { AppointmentModel } from "../models/appointment.model";
import { ConversationModel } from "../models/conversation.model";
import { UserModel } from "../models/user.model";

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

  async findPrescriptions(userId: string, range: DateRange) {
    return PrescriptionModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  async findAppointments(userId: string, range: DateRange) {
    return AppointmentModel.find({ userId, ...dateFilter("appointmentDate", range) }).sort({
      appointmentDate: -1,
    });
  },

  async findConversations(userId: string, range: DateRange) {
    return ConversationModel.find({ userId, ...dateFilter("createdAt", range) }).sort({ createdAt: -1 });
  },

  async findUserById(userId: string) {
    return UserModel.findById(userId).select("createdAt updatedAt");
  },
};
