import { AppointmentModel } from "../models/appointment.model";
import { IAppointment } from "../types/appointment.type";

export const AppointmentRepository = {
  async create(appointmentData: Omit<IAppointment, "_id" | "createdAt" | "updatedAt">) {
    const appointment = await AppointmentModel.create(appointmentData);
    return appointment.toObject();
  },

  async findById(id: string) {
    return await AppointmentModel.findById(id);
  },

  async findByUserId(userId: string) {
    return await AppointmentModel.find({ userId }).sort({ appointmentDate: 1 });
  },

  async update(id: string, updateData: Partial<IAppointment>) {
    return await AppointmentModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
  },

  async deleteById(id: string) {
    return await AppointmentModel.findByIdAndDelete(id);
  },
};
