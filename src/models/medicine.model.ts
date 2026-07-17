import mongoose, { Schema, Document } from "mongoose";
import { IMedicine, IMedicineLog } from "../types/medicine.type";

const MedicineSchema = new Schema<IMedicine>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dosage: {
      type: String,
      required: true,
      trim: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "as_needed"],
      required: true,
      default: "daily",
    },
    times: {
      type: [String],
      required: true,
      validate: {
        validator: function (times: string[]) {
          return times.length > 0;
        },
        message: "At least one time must be specified",
      },
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "completed"],
      required: true,
      default: "active",
    },
    quantity: {
      type: Number,
    },
    refillThreshold: {
      type: Number,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

const MedicineLogSchema = new Schema<IMedicineLog>(
  {
    medicineId: {
      type: String,
      required: true,
      ref: "Medicine",
    },
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    takenAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    scheduledTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["taken", "skipped", "missed"],
      required: true,
      default: "taken",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MedicineSchema.index({ userId: 1, status: 1 });
MedicineSchema.index({ userId: 1, startDate: 1 });
MedicineLogSchema.index({ medicineId: 1, takenAt: -1 });
MedicineLogSchema.index({ userId: 1, takenAt: -1 });

export const MedicineModel = mongoose.model<IMedicine>("Medicine", MedicineSchema);
export const MedicineLogModel = mongoose.model<IMedicineLog>("MedicineLog", MedicineLogSchema);
