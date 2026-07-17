import { UserModel } from "../models/user.model";
import { MedicineModel } from "../models/medicine.model";
import { PrescriptionModel } from "../models/prescription.model";
import { AppointmentModel } from "../models/appointment.model";
import { ConversationModel } from "../models/conversation.model";

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
};
