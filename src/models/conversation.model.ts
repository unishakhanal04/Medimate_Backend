import mongoose, { Schema } from "mongoose";
import { IConversation } from "../types/ai.type";

const ConversationSchema = new Schema<IConversation>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New Conversation",
    },
  },
  {
    timestamps: true,
  }
);

ConversationSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationModel = mongoose.model<IConversation>(
  "Conversation",
  ConversationSchema
);
