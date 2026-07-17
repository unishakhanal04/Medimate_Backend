import { AppointmentModel } from "../models/appointment.model";
import { UserModel } from "../models/user.model";

export const ReportsRepository = {
  async countAppointmentsByStatus(userId: string) {
    const [total, scheduled, completed, cancelled] = await Promise.all([
      AppointmentModel.countDocuments({ userId }),
      AppointmentModel.countDocuments({ userId, status: "scheduled" }),
      AppointmentModel.countDocuments({ userId, status: "completed" }),
      AppointmentModel.countDocuments({ userId, status: "cancelled" }),
    ]);
    return { total, scheduled, completed, cancelled };
  },

  async findNextAppointment(userId: string, now: Date) {
    return await AppointmentModel.findOne({
      userId,
      status: "scheduled",
      appointmentDate: { $gte: now },
    }).sort({ appointmentDate: 1 });
  },

  async findUserById(userId: string) {
    return await UserModel.findById(userId).select("username email createdAt");
  },
};
