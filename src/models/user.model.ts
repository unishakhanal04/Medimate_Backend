import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "../types/user.type";

export interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    password: { type: String, required: true },
    profileImage: { type: String, default: null },
    role: { type: String, enum: ["user", "admin"], default: "user", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active", required: true },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
