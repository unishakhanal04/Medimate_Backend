import { NextFunction, Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { FeedbackModel, FeedbackType } from "../models/feedback.model";
import { sendSuccess } from "../utils/apihelper.util";

const VALID_TYPES: FeedbackType[] = ["bug_report", "suggestion", "feature_request", "general"];

const userId = (req: AuthRequest) => {
  if (!req.user?.userId) throw new HttpException(401, "User not authenticated");
  return req.user.userId;
};

export const createFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, subject, message } = req.body;
    if (!VALID_TYPES.includes(type)) {
      throw new HttpException(400, "A valid feedback type is required");
    }
    if (!subject || !message) {
      throw new HttpException(400, "Subject and message are required");
    }

    const feedback = await FeedbackModel.create({ userId: userId(req), type, subject, message });
    sendSuccess(res, feedback, "Feedback submitted successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const listMyFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const items = await FeedbackModel.find({ userId: userId(req) }).sort({ createdAt: -1 });
    sendSuccess(res, items, "Feedback retrieved successfully");
  } catch (err) {
    next(err);
  }
};
