import dotenv from "dotenv";
dotenv.config();

export const CONSTANTS = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || "0.0.0.0",
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/medimate",
  JWT_SECRET: process.env.JWT_SECRET || "changeme_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_ROUNDS: 10,
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "MediMate <no-reply@medimate.local>",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-flash-latest",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",

  // eSewa v2 sandbox — defaults are eSewa's own public test-merchant credentials
  // (EPAYTEST), documented for developer testing. Safe to ship as defaults since
  // they only work against eSewa's rc- (sandbox) endpoints, not production.
  ESEWA_PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",
  ESEWA_SECRET_KEY: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",
  ESEWA_PAYMENT_URL: process.env.ESEWA_PAYMENT_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  ESEWA_STATUS_URL: process.env.ESEWA_STATUS_URL || "https://rc.esewa.com.np/api/epay/transaction/status/",
  PREMIUM_PRICE_NPR: Number(process.env.PREMIUM_PRICE_NPR) || 999,
  PREMIUM_DURATION_DAYS: Number(process.env.PREMIUM_DURATION_DAYS) || 30,
  FREE_AI_MESSAGE_LIMIT: Number(process.env.FREE_AI_MESSAGE_LIMIT) || 20,

  VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY || "",
  VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY || "",
  VAPID_SUBJECT: process.env.VAPID_SUBJECT || "mailto:admin@medimate.local",
};
