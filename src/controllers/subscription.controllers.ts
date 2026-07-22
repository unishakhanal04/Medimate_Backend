import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";
import {
  getCurrentSubscription,
  getPaymentHistory,
  initiateSubscriptionPayment,
  verifySubscriptionPayment,
} from "../services/subscription.services";

const userId = (req: AuthRequest) => {
  if (!req.user?.userId) throw new HttpException(401, "User not authenticated");
  return req.user.userId;
};

export const getCurrent = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const subscription = await getCurrentSubscription(userId(req));
    sendSuccess(res, subscription, "Subscription status retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const payments = await getPaymentHistory(userId(req));
    sendSuccess(res, payments, "Payment history retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const initiatePayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await initiateSubscriptionPayment(userId(req));
    sendSuccess(res, result, "Payment initiated successfully");
  } catch (err) {
    next(err);
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { transactionUuid } = req.body;
    if (!transactionUuid || typeof transactionUuid !== "string") {
      throw new HttpException(400, "transactionUuid is required");
    }
    const result = await verifySubscriptionPayment(userId(req), transactionUuid);
    sendSuccess(res, result, "Payment verified successfully");
  } catch (err) {
    next(err);
  }
};
