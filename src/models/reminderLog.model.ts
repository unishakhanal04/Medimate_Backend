import mongoose, { Document, Schema } from "mongoose";

export type ReminderLogStatus = "taken" | "snoozed" | "skipped";

export interface IReminderLogDocument extends Document {
  userId: string;
  reminderId: string;
  date: string;
  status: ReminderLogStatus;
}

const reminderLogSchema = new Schema<IReminderLogDocument>(
  {
    userId: { type: String, required: true, index: true },
    reminderId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["taken", "snoozed", "skipped"], required: true },
  },
  { timestamps: true }
);

reminderLogSchema.index({ reminderId: 1, date: 1 }, { unique: true });

export const ReminderLogModel = mongoose.model<IReminderLogDocument>("ReminderLog", reminderLogSchema);
