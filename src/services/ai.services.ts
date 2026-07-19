import { GoogleGenAI, ApiError } from "@google/genai";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";
import { AiRepository } from "../repositories/ai.repository";

const SYSTEM_PROMPT =
  "You are MediMate's AI health assistant. You help users understand their medications, " +
  "reminders, and general health questions inside the MediMate app. You are not a substitute " +
  "for professional medical advice — encourage the user to consult a doctor or pharmacist for " +
  "diagnosis, dosage changes, or anything urgent. Keep answers concise, friendly, and easy to read.";

const HISTORY_LIMIT = 20;

let geminiClient: GoogleGenAI | null = null;

const getClient = () => {
  if (!CONSTANTS.GEMINI_API_KEY) {
    throw new HttpException(500, "AI assistant is not configured. Set GEMINI_API_KEY in the backend .env file.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: CONSTANTS.GEMINI_API_KEY });
  }
  return geminiClient;
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

    let replyText: string;
    try {
      const response = await client.models.generateContent({
        model: CONSTANTS.GEMINI_MODEL,
        contents: recentMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 1024,
        },
      });
      replyText = response.text ?? "";
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          throw new HttpException(502, "AI assistant rejected the configured API key. Check GEMINI_API_KEY.");
        }
        if (err.status === 429) {
          throw new HttpException(429, "AI assistant is rate-limited right now. Please try again shortly.");
        }
        if (err.status === 400) {
          throw new HttpException(502, err.message || "AI assistant rejected the request.");
        }
        throw new HttpException(502, err.message || "Could not reach the AI assistant service. Please try again.");
      }
      throw err;
    }

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
