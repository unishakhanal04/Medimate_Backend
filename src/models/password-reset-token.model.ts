import mongoose, { Document, Schema } from "mongoose";

export interface IPasswordResetTokenDocument extends Document {
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
}

const passwordResetTokenSchema = new Schema<IPasswordResetTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const PasswordResetTokenModel = mongoose.model<IPasswordResetTokenDocument>(
  "PasswordResetToken",
  passwordResetTokenSchema
);
