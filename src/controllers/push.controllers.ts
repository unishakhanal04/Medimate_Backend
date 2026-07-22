import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { PushService } from "../services/push.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

export const getVapidPublicKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const publicKey = PushService.getVapidPublicKey();
    sendSuccess(res, { publicKey }, "VAPID public key retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const subscribe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    await PushService.subscribe(req.user.userId, req.body);
    sendSuccess(res, { subscribed: true }, "Subscribed to push notifications");
  } catch (err) {
    next(err);
  }
};

export const unsubscribe = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const { endpoint } = req.body as { endpoint?: unknown };
    if (typeof endpoint !== "string" || !endpoint) {
      throw new HttpException(400, "An endpoint is required");
    }

    await PushService.unsubscribe(req.user.userId, endpoint);
    sendSuccess(res, { subscribed: false }, "Unsubscribed from push notifications");
  } catch (err) {
    next(err);
  }
};

export const getStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const subscribed = await PushService.isSubscribed(req.user.userId);
    sendSuccess(res, { subscribed }, "Push subscription status retrieved successfully");
  } catch (err) {
    next(err);
  }
};
