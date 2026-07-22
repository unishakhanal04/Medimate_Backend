import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { TimelineService } from "../services/timeline.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";
import { TimelineEventType } from "../types/timeline.type";

const validTypes: TimelineEventType[] = [
  "medicine_added",
  "medicine_taken",
  "medicine_skipped",
  "medicine_missed",
  "reminder_snoozed",
  "prescription_uploaded",
  "appointment_created",
  "appointment_completed",
  "emergency_contact_added",
  "ai_conversation",
  "profile_updated",
  "password_changed",
];

export const getTimeline = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 20, 1), 100);

    const types = typeof req.query.type === "string"
      ? req.query.type
          .split(",")
          .map((t) => t.trim())
          .filter((t): t is TimelineEventType => validTypes.includes(t as TimelineEventType))
      : undefined;

    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;

    const timeline = await TimelineService.getTimeline(req.user.userId, {
      page,
      pageSize,
      types: types?.length ? types : undefined,
      from,
      to,
    });

    sendSuccess(res, timeline, "Timeline retrieved successfully");
  } catch (err) {
    next(err);
  }
};
