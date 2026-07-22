import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLogDocument extends Document {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  description: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    targetType: { type: String },
    targetId: { type: String },
    targetLabel: { type: String },
    description: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<IAuditLogDocument>("AuditLog", auditLogSchema);
