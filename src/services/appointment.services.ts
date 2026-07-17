import { AppointmentRepository } from "../repositories/appointment.repository";
import { HttpException } from "../exceptions/http-exception";
import { IAppointment, CreateAppointmentDTO, UpdateAppointmentDTO } from "../types/appointment.type";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const isUpcoming = (appointment: IAppointment, today: Date) =>
  appointment.status === "scheduled" && new Date(appointment.appointmentDate) >= today;

export const AppointmentService = {
  async createAppointment(userId: string, data: CreateAppointmentDTO) {
    const appointmentData: Omit<IAppointment, "_id" | "createdAt" | "updatedAt"> = {
      userId,
      doctorName: data.doctorName,
      specialization: data.specialization,
      hospital: data.hospital,
      appointmentDate: new Date(data.appointmentDate),
      appointmentTime: data.appointmentTime,
      purpose: data.purpose,
      notes: data.notes,
      status: "scheduled",
      reminderEnabled: data.reminderEnabled ?? false,
    };

    return await AppointmentRepository.create(appointmentData);
  },

  async getAppointmentsByUserId(userId: string) {
    return await AppointmentRepository.findByUserId(userId);
  },

  async getAppointmentById(id: string, userId: string) {
    const appointment = await AppointmentRepository.findById(id);
    if (!appointment) {
      throw new HttpException(404, "Appointment not found");
    }
    if (appointment.userId !== userId) {
      throw new HttpException(403, "Access denied");
    }
    return appointment;
  },

  async updateAppointment(id: string, userId: string, data: UpdateAppointmentDTO) {
    await this.getAppointmentById(id, userId);

    const updateData: Partial<IAppointment> = {};
    if (data.doctorName !== undefined) updateData.doctorName = data.doctorName;
    if (data.specialization !== undefined) updateData.specialization = data.specialization;
    if (data.hospital !== undefined) updateData.hospital = data.hospital;
    if (data.appointmentDate !== undefined) updateData.appointmentDate = new Date(data.appointmentDate);
    if (data.appointmentTime !== undefined) updateData.appointmentTime = data.appointmentTime;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.reminderEnabled !== undefined) updateData.reminderEnabled = data.reminderEnabled;

    const updatedAppointment = await AppointmentRepository.update(id, updateData);
    if (!updatedAppointment) {
      throw new HttpException(404, "Appointment not found");
    }
    return updatedAppointment;
  },

  async deleteAppointment(id: string, userId: string) {
    await this.getAppointmentById(id, userId);
    await AppointmentRepository.deleteById(id);
  },

  async getUpcomingAppointments(userId: string) {
    const appointments = await AppointmentRepository.findByUserId(userId);
    const today = startOfToday();
    return appointments.filter((appointment) => isUpcoming(appointment, today));
  },

  async getPastAppointments(userId: string) {
    const appointments = await AppointmentRepository.findByUserId(userId);
    const today = startOfToday();
    return appointments.filter((appointment) => !isUpcoming(appointment, today));
  },
};
