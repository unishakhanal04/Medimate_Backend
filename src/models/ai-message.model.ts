import mongoose, { Schema } from "mongoose";
import { IAiMessage } from "../types/ai.type";

const aiMessageSchema = new Schema<IAiMessage>(
  {
    userId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, ref: "Conversation" },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

aiMessageSchema.index({ userId: 1, createdAt: 1 });

export const AiMessageModel = mongoose.model<IAiMessage>("AiMessage", aiMessageSchema);
