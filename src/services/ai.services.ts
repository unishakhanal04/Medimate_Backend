import Anthropic from "@anthropic-ai/sdk";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";
import { AiRepository } from "../repositories/ai.repository";

const SYSTEM_PROMPT =
  "You are MediMate's AI health assistant. You help users understand their medications, " +
  "reminders, and general health questions inside the MediMate app. You are not a substitute " +
  "for professional medical advice — encourage the user to consult a doctor or pharmacist for " +
  "diagnosis, dosage changes, or anything urgent. Keep answers concise, friendly, and easy to read.";

const HISTORY_LIMIT = 20;

let anthropicClient: Anthropic | null = null;

const getClient = () => {
  if (!CONSTANTS.ANTHROPIC_API_KEY) {
    throw new HttpException(
      500,
      "AI assistant is not configured. Set ANTHROPIC_API_KEY in the backend .env file."
    );
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: CONSTANTS.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
};

export const AiService = {
  async sendMessage(userId: string, text: string) {
    const client = getClient();

    const conversation =
      (await AiRepository.findActiveConversation(userId)) ??
      (await AiRepository.createConversation(userId));
    const conversationId = conversation._id.toString();

    await AiRepository.createMessage({ userId, conversationId, role: "user", content: text });

    const recentMessages = await AiRepository.findRecentMessagesByUserId(userId, HISTORY_LIMIT);

    const response = await client.messages.create({
      model: CONSTANTS.ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: recentMessages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const replyText = textBlock?.text ?? "";

    await AiRepository.createMessage({ userId, conversationId, role: "assistant", content: replyText });
    await AiRepository.touchConversation(conversationId);

    return { role: "assistant" as const, content: replyText };
  },

  async getHistory(userId: string) {
    const messages = await AiRepository.findMessagesByUserId(userId);
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
    }));
  },

  async clearHistory(userId: string) {
    await AiRepository.deleteMessagesByUserId(userId);
    await AiRepository.deleteConversationsByUserId(userId);
  },
};
