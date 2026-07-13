import dotenv from "dotenv";
dotenv.config();

export const CONSTANTS = {
  PORT: process.env.PORT || 5000,
  HOST: process.env.HOST || "0.0.0.0",
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/medimate",
  JWT_SECRET: process.env.JWT_SECRET || "changeme_secret",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  BCRYPT_ROUNDS: 10,
};
