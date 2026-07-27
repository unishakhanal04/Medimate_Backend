import { ApiError } from "@google/genai";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";
import { AiRepository } from "../repositories/ai.repository";
import { SystemErrorLogModel } from "../models/system-error-log.model";
import { MedicineService } from "./medicine.services";
import { AppointmentService } from "./appointment.services";
import { DrugInteractionService } from "./drug-interaction.services";
import { getGeminiClient } from "../utils/gemini.util";

const SYSTEM_PROMPT =
  "You are MediMate's AI health assistant. You help users understand their medications, " +
  "reminders, and general health questions inside the MediMate app. You are not a substitute " +
  "for professional medical advice — encourage the user to consult a doctor or pharmacist for " +
  "diagnosis, dosage changes, or anything urgent. Keep answers concise, friendly, and easy to read. " +
  "You may be given a snapshot of the user's current medicines, today's dose schedule, adherence, " +
  "upcoming appointments, and possible medicine interaction flags below — use it to give specific, " +
  "personalized answers (for example, pointing out a missed dose or a dose due soon) instead of " +
  "generic advice. Only reference data that is actually provided to you; never invent medicine " +
  "names, doses, appointments, or interactions. Interaction flags come from automated FDA label " +
  "text matching, not a clinical review — always tell the user to confirm with a doctor or " +
  "pharmacist before changing anything.";

const HISTORY_LIMIT = 20;

async function buildUserContextBlock(userId: string): Promise<string> {
  try {
    const [todayMedicines, adherence, upcomingAppointments, interactionFlags] = await Promise.all([
      MedicineService.getTodayMedicines(userId),
      MedicineService.getAdherenceStats(userId),
      AppointmentService.getUpcomingAppointments(userId),
      DrugInteractionService.checkAllActiveMedicines(userId).catch((err) => {
        console.error("Failed to check drug interactions for AI context:", err);
        return [];
      }),
    ]);

    const lines: string[] = [];

    if (todayMedicines.length > 0) {
      lines.push("Today's medicine schedule:");
      for (const m of todayMedicines) {
        lines.push(`- ${m.time} ${m.name} (${m.dosage}) — ${m.status}`);
      }
    }

    lines.push(
      `7-day adherence: ${adherence.weeklyAdherence}% (${adherence.medicinesTaken}/${adherence.totalScheduled} scheduled doses taken), current streak: ${adherence.streak} day(s).`
    );

    if (upcomingAppointments.length > 0) {
      lines.push("Upcoming appointments:");
      for (const appointment of upcomingAppointments.slice(0, 5)) {
        const dateLabel = new Date(appointment.appointmentDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        const specialization = appointment.specialization ? ` (${appointment.specialization})` : "";
        lines.push(
          `- ${dateLabel} ${appointment.appointmentTime} with Dr. ${appointment.doctorName}${specialization} — ${appointment.purpose}`
        );
      }
    }

    if (interactionFlags.length > 0) {
      lines.push("Possible medicine interactions (from automated FDA label text matching, not a clinical review):");
      for (const flag of interactionFlags) {
        const otherNames = flag.warnings.map((w) => w.otherMedicineName).join(", ");
        lines.push(`- ${flag.medicineName} may interact with: ${otherNames}`);
      }
    }

    if (lines.length === 0) return "";

    return "User's current MediMate data as of now:\n" + lines.join("\n");
  } catch (err) {
    console.error("Failed to build AI user context:", err);
    return "";
  }
}

export const AiService = {
  async sendMessage(userId: string, text: string) {
    const client = getGeminiClient();

    const conversation =
      (await AiRepository.findActiveConversation(userId)) ??
      (await AiRepository.createConversation(userId));
    const conversationId = conversation._id.toString();

    await AiRepository.createMessage({ userId, conversationId, role: "user", content: text });

    const recentMessages = await AiRepository.findRecentMessagesByUserId(userId, HISTORY_LIMIT);
    const contextBlock = await buildUserContextBlock(userId);
    const systemInstruction = contextBlock ? `${SYSTEM_PROMPT}\n\n${contextBlock}` : SYSTEM_PROMPT;

    let replyText: string;
    try {
      const response = await client.models.generateContent({
        model: CONSTANTS.GEMINI_MODEL,
        contents: recentMessages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        config: {
          systemInstruction,
          maxOutputTokens: 1024,
        },
      });
      replyText = response.text ?? "";
    } catch (err) {
      const failureMessage = err instanceof Error ? err.message : "Unknown Gemini API failure";
      SystemErrorLogModel.create({ source: "gemini_api", message: failureMessage, userId }).catch((logErr) =>
        console.error("Failed to record Gemini API failure:", logErr)
      );

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
