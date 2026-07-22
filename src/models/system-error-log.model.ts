import mongoose, { Document, Schema } from "mongoose";

export type SystemErrorSource = "gemini_api" | "server";

export interface ISystemErrorLogDocument extends Document {
  source: SystemErrorSource;
  message: string;
  userId?: string;
  statusCode?: number;
  createdAt: Date;
}

const systemErrorLogSchema = new Schema<ISystemErrorLogDocument>(
  {
    source: { type: String, enum: ["gemini_api", "server"], required: true },
    message: { type: String, required: true },
    userId: { type: String },
    statusCode: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

systemErrorLogSchema.index({ createdAt: -1 });

export const SystemErrorLogModel = mongoose.model<ISystemErrorLogDocument>("SystemErrorLog", systemErrorLogSchema);
