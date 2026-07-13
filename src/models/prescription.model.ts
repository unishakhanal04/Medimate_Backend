import mongoose, { Document, Schema } from "mongoose";

export interface IPrescription {
  userId: string;
  imageUrl: string;
  uploadDate: Date;
  notes?: string;
  medicineName?: string;
  medicineTime?: string;
}

export interface IPrescriptionDocument extends IPrescription, Document {}

const prescriptionSchema = new Schema<IPrescriptionDocument>(
  {
    userId: { type: String, required: true },
    imageUrl: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
    medicineName: { type: String, default: "" },
    medicineTime: { type: String, default: "" },
  },
  { timestamps: true }
);

export const PrescriptionModel = mongoose.model<IPrescriptionDocument>("Prescription", prescriptionSchema);
