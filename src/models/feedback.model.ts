import mongoose, { Document, Schema } from "mongoose";

export type FeedbackType = "bug_report" | "suggestion" | "feature_request" | "general";
export type FeedbackStatus = "new" | "reviewed" | "resolved";

export interface IFeedbackDocument extends Document {
  userId: string;
  type: FeedbackType;
  subject: string;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedbackDocument>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["bug_report", "suggestion", "feature_request", "general"], required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "reviewed", "resolved"], default: "new" },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });

export const FeedbackModel = mongoose.model<IFeedbackDocument>("Feedback", feedbackSchema);
