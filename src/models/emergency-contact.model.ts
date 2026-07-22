import mongoose, { Document, Schema } from "mongoose";

export interface IEmergencyContactDocument extends Document {
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
}

const emergencyContactSchema = new Schema<IEmergencyContactDocument>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    isPrimary: { type: Boolean, default: false },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

export const EmergencyContactModel = mongoose.model<IEmergencyContactDocument>(
  "EmergencyContact",
  emergencyContactSchema
);
