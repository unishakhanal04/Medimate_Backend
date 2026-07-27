import mongoose, { Schema } from "mongoose";
import { IPrescription } from "../types/prescription.type";

const PrescriptionSchema = new Schema<IPrescription>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    doctorName: {
      type: String,
      required: true,
      trim: true,
    },
    hospital: {
      type: String,
      trim: true,
    },
    prescriptionDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    reviewDate: {
      type: Date,
    },
    medicines: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
    attachmentUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PrescriptionSchema.index({ userId: 1, prescriptionDate: -1 });
PrescriptionSchema.index({ userId: 1, expiryDate: 1 });

// Platform-wide, not scoped to one user: admin dashboard counts (prescriptions
// uploaded this week, expiring-soon totals) query across all users.
PrescriptionSchema.index({ createdAt: 1 });
PrescriptionSchema.index({ expiryDate: 1 });

export const PrescriptionModel = mongoose.model<IPrescription>(
  "Prescription",
  PrescriptionSchema
);
