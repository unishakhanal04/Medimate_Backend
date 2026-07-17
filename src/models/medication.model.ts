import mongoose, { Document, Schema } from "mongoose";

export interface IMedicationDocument extends Document {
  userId: string;
  name: string;
  dosage: string;
  times: string[];
  frequency: "daily" | "weekly" | "as_needed";
  instructions: string;
  active: boolean;
  lastTakenAt?: Date;
  createdAt: Date;
}

const medicationSchema = new Schema<IMedicationDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true },
    times: { type: [String], default: [] },
    frequency: { type: String, enum: ["daily", "weekly", "as_needed"], default: "daily" },
    instructions: { type: String, default: "" },
    active: { type: Boolean, default: true },
    lastTakenAt: { type: Date },
  },
  { timestamps: true }
);

export const MedicationModel = mongoose.model<IMedicationDocument>("Medication", medicationSchema);
