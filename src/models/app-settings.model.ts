import mongoose, { Document, Schema } from "mongoose";

export interface IAppSettingsDocument extends Document {
  maintenanceMode: boolean;
  updatedAt: Date;
}

const appSettingsSchema = new Schema<IAppSettingsDocument>(
  {
    maintenanceMode: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const AppSettingsModel = mongoose.model<IAppSettingsDocument>("AppSettings", appSettingsSchema);
