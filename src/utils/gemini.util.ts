import { GoogleGenAI } from "@google/genai";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";

let geminiClient: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (!CONSTANTS.GEMINI_API_KEY) {
    throw new HttpException(500, "AI features are not configured. Set GEMINI_API_KEY in the backend .env file.");
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({ apiKey: CONSTANTS.GEMINI_API_KEY });
  }
  return geminiClient;
};
