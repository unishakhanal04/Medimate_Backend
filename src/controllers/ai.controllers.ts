import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { AiService } from "../services/ai.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

export const chat = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const { message } = req.body as { message?: unknown };
    if (typeof message !== "string" || !message.trim()) {
      throw new HttpException(400, "A message is required");
    }

    const reply = await AiService.sendMessage(req.user.userId, message.trim());
    sendSuccess(res, reply, "Message sent successfully");
  } catch (err) {
    next(err);
  }
};

export const getUsage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const usage = await AiService.getUsage(req.user.userId);
    sendSuccess(res, usage, "AI usage retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const history = await AiService.getHistory(req.user.userId);
    sendSuccess(res, history, "History retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const clearHistory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    await AiService.clearHistory(req.user.userId);
    sendSuccess(res, { success: true }, "History cleared successfully");
  } catch (err) {
    next(err);
  }
};
