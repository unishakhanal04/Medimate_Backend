import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { RegisterDTO, LoginDTO, JwtPayload, PublicUser } from "../types/user.type";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { IUserDocument } from "../models/user.model";
import { PasswordResetTokenModel } from "../models/password-reset-token.model";
import { sendMail } from "../utils/mailer.util";
import { verifyGoogleIdToken } from "../utils/google.util";

export const toPublicUser = (user: IUserDocument): PublicUser => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  gender: user.gender,
  profileImage: user.profileImage,
  role: user.role,
  status: user.status,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  lastLoginAt: user.lastLoginAt,
});

const createAuthResponse = (user: IUserDocument) => {
  const payload: JwtPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
  const token = jwt.sign(payload, CONSTANTS.JWT_SECRET, {
    expiresIn: CONSTANTS.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  return {
    token,
    user: toPublicUser(user),
  };
};

export const registerUser = async (dto: RegisterDTO) => {
  const exists = await UserRepository.existsByEmail(dto.email);
  if (exists) {
    throw new HttpException(
      409,
      "This email is already registered. Please use the Login endpoint instead."
    );
  }

  const hashed = await bcrypt.hash(dto.password, CONSTANTS.BCRYPT_ROUNDS);
  const user = await UserRepository.create({
    username: dto.username,
    email: dto.email,
    gender: dto.gender,
    password: hashed,
    role: "user",
    status: "active",
  });

  return toPublicUser(user);
};

export const loginUser = async (dto: LoginDTO) => {
  const user = await UserRepository.findByEmail(dto.email);
  if (!user) {
    throw new HttpException(401, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(dto.password, user.password);
  if (!isMatch) {
    throw new HttpException(401, "Invalid credentials");
  }

  if (dto.portal && user.role !== dto.portal) {
    const portalLabel = dto.portal === "admin" ? "an admin" : "a user";
    throw new HttpException(403, `This account is not registered as ${portalLabel}. Please choose the correct login portal.`);
  }

  await UserRepository.update(user._id.toString(), { lastLoginAt: new Date() });

  return createAuthResponse(user);
};

export const loginWithGoogle = async (idToken: string) => {
  const profile = await verifyGoogleIdToken(idToken);

  let user = await UserRepository.findByEmail(profile.email);

  if (!user) {
    const randomPassword = crypto.randomBytes(32).toString("hex");
    const hashed = await bcrypt.hash(randomPassword, CONSTANTS.BCRYPT_ROUNDS);
    user = await UserRepository.create({
      username: profile.name,
      email: profile.email,
      gender: "other",
      password: hashed,
      role: "user",
      status: "active",
      profileImage: profile.picture ?? null,
    });
  }

  await UserRepository.update(user._id.toString(), { lastLoginAt: new Date() });

  return createAuthResponse(user);
};

export const getUserById = async (userId: string) => {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new HttpException(404, "User not found");
  }
  return toPublicUser(user);
};

export const updateUserProfile = async (
  userId: string,
  updateData: {
    username?: string;
    email?: string;
    gender?: "male" | "female" | "other";
    profileImage?: string | null;
  }
) => {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new HttpException(404, "User not found");
  }

  if (Object.keys(updateData).length === 0) {
    throw new HttpException(400, "No profile fields provided");
  }

  if (updateData.email) {
    updateData.email = updateData.email.trim().toLowerCase();
  }

  if (updateData.username) {
    updateData.username = updateData.username.trim();
  }

  if (updateData.email && updateData.email !== user.email) {
    const exists = await UserRepository.existsByEmail(updateData.email);
    if (exists) {
      throw new HttpException(409, "Email already in use");
    }
  }

  const updatedUser = await UserRepository.update(userId, updateData);
  if (!updatedUser) {
    throw new HttpException(404, "User not found");
  }
  return toPublicUser(updatedUser);
};

export const updateUserPassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new HttpException(404, "User not found");
  }

  if (newPassword.trim().length < 6) {
    throw new HttpException(400, "New password must be at least 6 characters");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new HttpException(401, "Current password is incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, CONSTANTS.BCRYPT_ROUNDS);
  await UserRepository.update(userId, { password: hashed, passwordChangedAt: new Date() });

  return { message: "Password updated successfully" };
};

export const requestPasswordReset = async (email: string) => {
  const user = await UserRepository.findByEmail(email);

  if (user) {
    // Invalidate any still-pending OTP requests for this user before issuing a new one.
    await PasswordResetTokenModel.updateMany(
      { userId: user._id.toString(), used: false },
      { used: true }
    );

    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, CONSTANTS.BCRYPT_ROUNDS);
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    await PasswordResetTokenModel.create({
      userId: user._id.toString(),
      token,
      expiresAt: new Date(now + 30 * 60 * 1000),
      otpHash,
      otpExpiresAt: new Date(now + 10 * 60 * 1000),
      otpAttempts: 0,
      otpVerified: false,
      used: false,
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(`[password-reset] OTP for ${user.email}: ${otp}`);
    }

    try {
      await sendMail(
        user.email,
        "Your MediMate password reset code",
        `<p>Hi ${user.username},</p>` +
          `<p>Your one-time verification code to reset your MediMate password is:</p>` +
          `<p style="font-size:28px;font-weight:700;letter-spacing:6px;">${otp}</p>` +
          `<p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`
      );
    } catch (err) {
      console.error("Failed to send password reset OTP email:", err);
    }
  }

  return { message: "If that email exists, a verification code has been sent." };
};

export const verifyPasswordResetOtp = async (email: string, otp: string) => {
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    throw new HttpException(400, "Invalid or expired code");
  }

  const record = await PasswordResetTokenModel.findOne({
    userId: user._id.toString(),
    used: false,
  }).sort({ createdAt: -1 });

  if (!record || record.otpExpiresAt.getTime() < Date.now()) {
    throw new HttpException(400, "Invalid or expired code. Please request a new one.");
  }

  if (record.otpAttempts >= 5) {
    throw new HttpException(429, "Too many incorrect attempts. Please request a new code.");
  }

  const isMatch = await bcrypt.compare(otp, record.otpHash);
  if (!isMatch) {
    record.otpAttempts += 1;
    await record.save();
    throw new HttpException(400, "Incorrect code. Please try again.");
  }

  record.otpVerified = true;
  await record.save();

  return { message: "Code verified successfully", resetToken: record.token };
};

export const resetPassword = async (token: string, newPassword: string) => {
  if (newPassword.trim().length < 6) {
    throw new HttpException(400, "New password must be at least 6 characters");
  }

  const resetToken = await PasswordResetTokenModel.findOne({ token, used: false });
  if (!resetToken || !resetToken.otpVerified || resetToken.expiresAt.getTime() < Date.now()) {
    throw new HttpException(400, "Invalid or expired reset session. Please start over.");
  }

  const hashed = await bcrypt.hash(newPassword, CONSTANTS.BCRYPT_ROUNDS);
  await UserRepository.update(resetToken.userId, { password: hashed, passwordChangedAt: new Date() });
  resetToken.used = true;
  await resetToken.save();

  return { message: "Password reset successfully" };
};
