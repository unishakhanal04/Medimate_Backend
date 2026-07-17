export type AppointmentStatus = "scheduled" | "completed" | "cancelled";

export interface IAppointment {
  _id: string;
  userId: string;
  doctorName: string;
  specialization?: string;
  hospital?: string;
  appointmentDate: Date;
  appointmentTime: string;
  purpose: string;
  notes?: string;
  status: AppointmentStatus;
  reminderEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentDTO {
  doctorName: string;
  specialization?: string;
  hospital?: string;
  appointmentDate: string;
  appointmentTime: string;
  purpose: string;
  notes?: string;
  reminderEnabled?: boolean;
}

export interface UpdateAppointmentDTO {
  doctorName?: string;
  specialization?: string;
  hospital?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  purpose?: string;
  notes?: string;
  status?: AppointmentStatus;
  reminderEnabled?: boolean;
}
