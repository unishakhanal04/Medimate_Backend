import { AiMessageModel } from "../models/ai-message.model";
import { ConversationModel } from "../models/conversation.model";
import { AiMessageRole } from "../types/ai.type";

export const AiRepository = {
  async findActiveConversation(userId: string) {
    return await ConversationModel.findOne({ userId }).sort({ updatedAt: -1 });
  },

  async createConversation(userId: string) {
    return await ConversationModel.create({ userId });
  },

  async touchConversation(conversationId: string) {
    await ConversationModel.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
  },

  async createMessage(data: {
    userId: string;
    conversationId: string;
    role: AiMessageRole;
    content: string;
  }) {
    return await AiMessageModel.create(data);
  },

  async findRecentMessagesByUserId(userId: string, limit: number) {
    const messages = await AiMessageModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return messages.reverse();
  },

  async findMessagesByUserId(userId: string) {
    return await AiMessageModel.find({ userId }).sort({ createdAt: 1 });
  },

  async countUserMessagesSince(userId: string, since: Date) {
    return await AiMessageModel.countDocuments({ userId, role: "user", createdAt: { $gte: since } });
  },

  async deleteMessagesByUserId(userId: string) {
    await AiMessageModel.deleteMany({ userId });
  },

  async deleteConversationsByUserId(userId: string) {
    await ConversationModel.deleteMany({ userId });
  },
};
