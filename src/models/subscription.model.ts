import mongoose, { Document, Schema } from "mongoose";

export type SubscriptionStatus = "active" | "expired" | "cancelled";

export interface ISubscriptionDocument extends Document {
  userId: string;
  plan: "premium";
  status: SubscriptionStatus;
  startDate: Date;
  expiresAt: Date;
  paymentId: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
  {
    userId: { type: String, required: true, index: true },
    plan: { type: String, enum: ["premium"], default: "premium" },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    startDate: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    paymentId: { type: String, required: true },
  },
  { timestamps: true }
);

subscriptionSchema.index({ userId: 1, status: 1 });

export const SubscriptionModel = mongoose.model<ISubscriptionDocument>("Subscription", subscriptionSchema);
