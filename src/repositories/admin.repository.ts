import { UserModel } from "../models/user.model";
import { MedicineModel, MedicineLogModel } from "../models/medicine.model";
import { PrescriptionModel } from "../models/prescription.model";
import { AppointmentModel } from "../models/appointment.model";
import { ConversationModel } from "../models/conversation.model";
import { AiMessageModel } from "../models/ai-message.model";
import { FeedbackModel, FeedbackStatus, FeedbackType } from "../models/feedback.model";

export const AdminRepository = {
  async countUsersByStatus() {
    const [total, active, inactive, admins] = await Promise.all([
      UserModel.countDocuments({}),
      UserModel.countDocuments({ status: "active" }),
      UserModel.countDocuments({ status: "inactive" }),
      UserModel.countDocuments({ role: "admin" }),
    ]);
    return { total, active, inactive, admins };
  },

  async countNewUsersSince(since: Date) {
    return UserModel.countDocuments({ createdAt: { $gte: since } });
  },

  async countUsersActiveSince(since: Date) {
    return UserModel.countDocuments({ lastLoginAt: { $gte: since } });
  },

  async findUserCreatedDatesSince(since: Date): Promise<Date[]> {
    const users = await UserModel.find({ createdAt: { $gte: since } }).select("createdAt");
    return users
      .map((user) => user.createdAt)
      .filter((date): date is Date => date !== undefined);
  },

  async countMedicinesByStatus() {
    const [total, active, inactive, completed] = await Promise.all([
      MedicineModel.countDocuments({}),
      MedicineModel.countDocuments({ status: "active" }),
      MedicineModel.countDocuments({ status: "inactive" }),
      MedicineModel.countDocuments({ status: "completed" }),
    ]);
    return { total, active, inactive, completed };
  },

  async countPrescriptions() {
    return PrescriptionModel.countDocuments({});
  },

  async countPrescriptionsCreatedSince(since: Date) {
    return PrescriptionModel.countDocuments({ createdAt: { $gte: since } });
  },

  async countMedicinesCreatedSince(since: Date) {
    return MedicineModel.countDocuments({ createdAt: { $gte: since } });
  },

  async countAppointmentsCreatedSince(since: Date) {
    return AppointmentModel.countDocuments({ createdAt: { $gte: since } });
  },

  async countUsersCreatedBetween(start: Date, end: Date) {
    return UserModel.countDocuments({ createdAt: { $gte: start, $lt: end } });
  },

  async countMedicinesCreatedBetween(start: Date, end: Date) {
    return MedicineModel.countDocuments({ createdAt: { $gte: start, $lt: end } });
  },

  async countAppointmentsCreatedBetween(start: Date, end: Date) {
    return AppointmentModel.countDocuments({ createdAt: { $gte: start, $lt: end } });
  },

  async countPrescriptionsCreatedBetween(start: Date, end: Date) {
    return PrescriptionModel.countDocuments({ createdAt: { $gte: start, $lt: end } });
  },

  async getAdherenceSnapshotSince(since: Date) {
    const [taken, total] = await Promise.all([
      MedicineLogModel.countDocuments({ takenAt: { $gte: since }, status: "taken" }),
      MedicineLogModel.countDocuments({ takenAt: { $gte: since }, status: { $in: ["taken", "skipped"] } }),
    ]);
    return { taken, total };
  },

  async countPrescriptionsExpiringSoon(now: Date, soon: Date) {
    return PrescriptionModel.countDocuments({ expiryDate: { $gte: now, $lte: soon } });
  },

  async countAppointmentsByStatus() {
    const [total, scheduled, completed, cancelled, upcoming] = await Promise.all([
      AppointmentModel.countDocuments({}),
      AppointmentModel.countDocuments({ status: "scheduled" }),
      AppointmentModel.countDocuments({ status: "completed" }),
      AppointmentModel.countDocuments({ status: "cancelled" }),
      AppointmentModel.countDocuments({ status: "scheduled", appointmentDate: { $gte: new Date() } }),
    ]);
    return { total, scheduled, completed, cancelled, upcoming };
  },

  async countAiConversations() {
    return ConversationModel.countDocuments({});
  },

  async countAiMessagesSince(since: Date) {
    return AiMessageModel.countDocuments({ role: "user", createdAt: { $gte: since } });
  },

  async findUsersByIds(ids: string[]) {
    if (!ids.length) return [];
    return UserModel.find({ _id: { $in: ids } }).select("username email");
  },

  async findFeedback({
    page,
    limit,
    type,
    status,
  }: {
    page: number;
    limit: number;
    type?: FeedbackType;
    status?: FeedbackStatus;
  }) {
    const query: Record<string, unknown> = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      FeedbackModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FeedbackModel.countDocuments(query),
    ]);

    return { items, total };
  },

  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    return FeedbackModel.findByIdAndUpdate(id, { status }, { new: true });
  },

  async findMedicineTakenDatesSince(since: Date): Promise<Date[]> {
    const logs = await MedicineLogModel.find({ takenAt: { $gte: since }, status: "taken" }).select("takenAt");
    return logs.map((log) => log.takenAt).filter((date): date is Date => date !== undefined);
  },

  async findAppointmentCreatedDatesSince(since: Date): Promise<Date[]> {
    const appointments = await AppointmentModel.find({ createdAt: { $gte: since } }).select("createdAt");
    return appointments.map((appointment) => appointment.createdAt).filter((date): date is Date => date !== undefined);
  },

  async findPrescriptionCreatedDatesSince(since: Date): Promise<Date[]> {
    const prescriptions = await PrescriptionModel.find({ createdAt: { $gte: since } }).select("createdAt");
    return prescriptions.map((prescription) => prescription.createdAt).filter((date): date is Date => date !== undefined);
  },

  async findConversationCreatedDatesSince(since: Date): Promise<Date[]> {
    const conversations = await ConversationModel.find({ createdAt: { $gte: since } }).select("createdAt");
    return conversations.map((conversation) => conversation.createdAt).filter((date): date is Date => date !== undefined);
  },
};
