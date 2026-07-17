import mongoose, { Schema } from "mongoose";
import { IAppointment } from "../types/appointment.type";

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    appointmentTime: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      required: true,
      default: "scheduled",
    },
    reminderEnabled: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
AppointmentSchema.index({ userId: 1, status: 1 });
AppointmentSchema.index({ userId: 1, appointmentDate: 1 });

export const AppointmentModel = mongoose.model<IAppointment>("Appointment", AppointmentSchema);
