import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordResetTokenDocument extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  otpHash: string;
  otpExpiresAt: Date;
  otpAttempts: number;
  otpVerified: boolean;
  used: boolean;
}

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    // Reset ticket: generated up front, but only usable once the OTP below is verified.
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    otpHash: { type: String, required: true },
    otpExpiresAt: { type: Date, required: true },
    otpAttempts: { type: Number, default: 0 },
    otpVerified: { type: Boolean, default: false },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PasswordResetTokenModel = mongoose.model<IPasswordResetTokenDocument>(
  "PasswordResetToken",
  passwordResetTokenSchema
);
