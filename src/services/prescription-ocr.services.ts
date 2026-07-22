import { ApiError } from "@google/genai";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";
import { SystemErrorLogModel } from "../models/system-error-log.model";
import { getGeminiClient } from "../utils/gemini.util";

const EXTRACTION_PROMPT = `You are reading a photo or scan of a doctor's prescription for a medication-tracking app.
Extract the following fields as strict JSON, with no markdown formatting and no extra commentary:

{
  "doctorName": string | null,
  "hospital": string | null,
  "prescriptionDate": string | null,
  "diagnosis": string | null,
  "medicines": string[],
  "notes": string | null
}

Rules:
- "prescriptionDate" must be an ISO date (YYYY-MM-DD) if a date is visible on the document, otherwise null.
- "medicines" lists each medicine with its dosage/frequency exactly as written, one string per medicine (e.g. "Amoxicillin 500mg - 3 times daily"). Use an empty array if none are legible.
- If a field is not visible or you are not confident about it, use null — never guess or invent a value.
- Respond with only the JSON object, nothing else.`;

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export interface ExtractedPrescriptionData {
  doctorName: string | null;
  hospital: string | null;
  prescriptionDate: string | null;
  diagnosis: string | null;
  medicines: string[];
  notes: string | null;
}

const isExtractedPrescriptionData = (value: unknown): value is Record<string, unknown> & { medicines: unknown } =>
  typeof value === "object" && value !== null && Array.isArray((value as { medicines?: unknown }).medicines);

const UNREADABLE_MESSAGE = "Could not read the prescription. Try a clearer photo, or enter the details manually.";

export const PrescriptionOcrService = {
  async extractFromFile(userId: string, file: Express.Multer.File): Promise<ExtractedPrescriptionData> {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new HttpException(400, "Only JPEG, PNG, WEBP images or PDF files are supported for extraction.");
    }

    const client = getGeminiClient();

    try {
      const response = await client.models.generateContent({
        model: CONSTANTS.GEMINI_MODEL,
        contents: [
          {
            role: "user",
            parts: [
              { text: EXTRACTION_PROMPT },
              { inlineData: { mimeType: file.mimetype, data: file.buffer.toString("base64") } },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
          maxOutputTokens: 1024,
        },
      });

      let parsed: unknown;
      try {
        parsed = JSON.parse(response.text ?? "");
      } catch {
        throw new HttpException(502, UNREADABLE_MESSAGE);
      }

      if (!isExtractedPrescriptionData(parsed)) {
        throw new HttpException(502, UNREADABLE_MESSAGE);
      }

      return {
        doctorName: typeof parsed.doctorName === "string" ? parsed.doctorName : null,
        hospital: typeof parsed.hospital === "string" ? parsed.hospital : null,
        prescriptionDate: typeof parsed.prescriptionDate === "string" ? parsed.prescriptionDate : null,
        diagnosis: typeof parsed.diagnosis === "string" ? parsed.diagnosis : null,
        medicines: Array.isArray(parsed.medicines) ? parsed.medicines.filter((m): m is string => typeof m === "string") : [],
        notes: typeof parsed.notes === "string" ? parsed.notes : null,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;

      const failureMessage = err instanceof Error ? err.message : "Unknown Gemini API failure";
      SystemErrorLogModel.create({ source: "gemini_api", message: failureMessage, userId }).catch((logErr) =>
        console.error("Failed to record Gemini API failure:", logErr)
      );

      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 403) {
          throw new HttpException(502, "AI assistant rejected the configured API key. Check GEMINI_API_KEY.");
        }
        if (err.status === 429) {
          throw new HttpException(429, "Extraction is rate-limited right now. Please try again shortly.");
        }
        throw new HttpException(502, err.message || UNREADABLE_MESSAGE);
      }
      throw new HttpException(502, UNREADABLE_MESSAGE);
    }
  },
};
