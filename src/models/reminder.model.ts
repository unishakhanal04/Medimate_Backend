import mongoose, { Document, Schema } from "mongoose";

export interface IReminderDocument extends Document {
  userId: string;
  medicationId?: string;
  title: string;
  time: string;
  days: string[];
  enabled: boolean;
}

const reminderSchema = new Schema<IReminderDocument>(
  {
    userId: { type: String, required: true, index: true },
    medicationId: { type: String },
    title: { type: String, required: true, trim: true },
    time: { type: String, required: true },
    days: { type: [String], default: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ReminderModel = mongoose.model<IReminderDocument>("Reminder", reminderSchema);
