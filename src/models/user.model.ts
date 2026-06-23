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
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUserDocument>("User", userSchema);
