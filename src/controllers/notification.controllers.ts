import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { NotificationService } from "../services/notification.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

export const getNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const result = await NotificationService.getNotifications(req.user.userId);
    sendSuccess(res, result, "Notifications retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const markNotificationsSeen = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const result = await NotificationService.markAllSeen(req.user.userId);
    sendSuccess(res, result, "Notifications marked as read");
  } catch (err) {
    next(err);
  }
};
