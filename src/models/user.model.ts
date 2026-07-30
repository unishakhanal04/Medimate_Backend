import mongoose, { Document, Schema } from "mongoose";
import { IUser, IUserPreferences } from "../types/user.type";

export interface IUserDocument extends IUser, Document {}

const preferencesSchema = new Schema<IUserPreferences>(
  {
    darkMode: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    medicineReminders: { type: Boolean, default: true },
    appointmentReminders: { type: Boolean, default: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", required: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String, trim: true },
    allergies: { type: [String], default: [] },
    chronicDiseases: { type: [String], default: [] },
    height: { type: Number },
    weight: { type: Number },
    passwordChangedAt: { type: Date },
    profileUpdatedAt: { type: Date },
    notificationsLastSeenAt: { type: Date },
    lastLoginAt: { type: Date },
    preferences: {
      type: preferencesSchema,
      default: () => ({
        darkMode: false,
        emailNotifications: true,
        medicineReminders: true,
        appointmentReminders: true,
      }),
    },
  },
  { timestamps: true }
);

// Supports the admin dashboard's platform-wide counts (new/active users over
// time), which query across all users rather than being scoped to one userId.
userSchema.index({ createdAt: 1 });
userSchema.index({ lastLoginAt: 1 });

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
