import mongoose, { Document, Schema } from "mongoose";

export type PaymentStatus = "pending" | "success" | "failed";

export interface IPaymentDocument extends Document {
  userId: string;
  transactionUuid: string;
  amount: number;
  gateway: "esewa";
  status: PaymentStatus;
  esewaRefId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPaymentDocument>(
  {
    userId: { type: String, required: true, index: true },
    transactionUuid: { type: String, required: true, unique: true },
    amount: { type: Number, required: true },
    gateway: { type: String, enum: ["esewa"], default: "esewa" },
    status: { type: String, enum: ["pending", "success", "failed"], default: "pending" },
    esewaRefId: { type: String },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });

export const PaymentModel = mongoose.model<IPaymentDocument>("Payment", paymentSchema);
