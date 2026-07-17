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
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
};
