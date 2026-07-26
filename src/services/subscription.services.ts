import crypto from "crypto";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { PaymentModel } from "../models/payment.model";
import { SubscriptionModel } from "../models/subscription.model";
import { generateEsewaSignature, checkEsewaTransactionStatus, ESEWA_SIGNED_FIELD_NAMES } from "../utils/esewa.util";
import {
  InitiatePaymentResponse,
  PaymentHistoryItem,
  SubscriptionStatusResponse,
  VerifyPaymentResponse,
} from "../types/subscription.type";

export const isUserPremium = async (userId: string): Promise<boolean> => {
  const active = await SubscriptionModel.findOne({
    userId,
    status: "active",
    expiresAt: { $gte: new Date() },
  });
  return Boolean(active);
};

export const getCurrentSubscription = async (userId: string): Promise<SubscriptionStatusResponse> => {
  const latest = await SubscriptionModel.findOne({ userId }).sort({ expiresAt: -1 });
  const isActive = Boolean(latest && latest.status === "active" && latest.expiresAt >= new Date());

  return {
    plan: isActive ? "premium" : "free",
    status: latest?.status ?? null,
    expiresAt: latest?.expiresAt ?? null,
    priceNpr: CONSTANTS.PREMIUM_PRICE_NPR,
  };
};

export const getPaymentHistory = async (userId: string): Promise<PaymentHistoryItem[]> => {
  const payments = await PaymentModel.find({ userId }).sort({ createdAt: -1 });
  return payments.map((p) => ({
    id: p._id.toString(),
    transactionUuid: p.transactionUuid,
    amount: p.amount,
    gateway: p.gateway,
    status: p.status,
    esewaRefId: p.esewaRefId,
    createdAt: p.createdAt,
  }));
};

const activatePremiumSubscription = async (userId: string, paymentId: string): Promise<void> => {
  const existingActive = await SubscriptionModel.findOne({
    userId,
    status: "active",
    expiresAt: { $gte: new Date() },
  });

  const startDate = new Date();
  const baseDate = existingActive ? existingActive.expiresAt : startDate;
  const expiresAt = new Date(baseDate);
  expiresAt.setDate(expiresAt.getDate() + CONSTANTS.PREMIUM_DURATION_DAYS);

  if (existingActive) {
    existingActive.expiresAt = expiresAt;
    existingActive.paymentId = paymentId;
    await existingActive.save();
  } else {
    await SubscriptionModel.create({
      userId,
      plan: "premium",
      status: "active",
      startDate,
      expiresAt,
      paymentId,
    });
  }
};

export const initiateSubscriptionPayment = async (userId: string): Promise<InitiatePaymentResponse> => {
  const transactionUuid = crypto.randomUUID();
  const amount = String(CONSTANTS.PREMIUM_PRICE_NPR);

  await PaymentModel.create({
    userId,
    transactionUuid,
    amount: CONSTANTS.PREMIUM_PRICE_NPR,
    gateway: "esewa",
    status: "pending",
  });

  const signature = generateEsewaSignature(amount, transactionUuid, CONSTANTS.ESEWA_PRODUCT_CODE);

  const fields: Record<string, string> = {
    amount,
    tax_amount: "0",
    total_amount: amount,
    transaction_uuid: transactionUuid,
    product_code: CONSTANTS.ESEWA_PRODUCT_CODE,
    product_service_charge: "0",
    product_delivery_charge: "0",
    success_url: `${CONSTANTS.FRONTEND_URL}/user/subscription/success`,
    failure_url: `${CONSTANTS.FRONTEND_URL}/user/subscription/failure`,
    signed_field_names: ESEWA_SIGNED_FIELD_NAMES,
    signature,
  };

  return {
    paymentUrl: CONSTANTS.ESEWA_PAYMENT_URL,
    fields,
    transactionUuid,
  };
};

export const verifySubscriptionPayment = async (
  userId: string,
  transactionUuid: string
): Promise<VerifyPaymentResponse> => {
  const payment = await PaymentModel.findOne({ userId, transactionUuid });
  if (!payment) {
    throw new HttpException(404, "Payment record not found");
  }

  if (payment.status === "success") {
    return { status: "success", subscription: await getCurrentSubscription(userId) };
  }

  const esewaStatus = await checkEsewaTransactionStatus(transactionUuid, String(payment.amount));

  if (esewaStatus.status === "COMPLETE") {
    payment.status = "success";
    payment.esewaRefId = esewaStatus.ref_id;
    await payment.save();

    await activatePremiumSubscription(userId, payment._id.toString());

    return { status: "success", subscription: await getCurrentSubscription(userId) };
  }

  if (esewaStatus.status === "PENDING") {
    return { status: "pending", subscription: await getCurrentSubscription(userId) };
  }

  payment.status = "failed";
  await payment.save();
  return { status: "failed", subscription: await getCurrentSubscription(userId) };
};
