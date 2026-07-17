import { Request, Response, NextFunction } from "express";
import {
  registerUser,
  loginUser,
  getUserById,
  updateUserProfile,
  updateUserPassword,
  requestPasswordReset,
  resetPassword as resetPasswordService,
} from "../services/user.services";
import { sendSuccess } from "../utils/apihelper.util";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { HttpException } from "../exceptions/http-exception";

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await registerUser(req.body);
    sendSuccess(res, result, "User registered successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await loginUser(req.body);
    sendSuccess(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }
    const user = await getUserById(req.user.userId);
    sendSuccess(res, user, "Profile retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const uploadImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    // In a real implementation, you would:
    // 1. Save the file to cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Return the URL of the uploaded file

    // For web frontend, use localhost
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    sendSuccess(res, { imageUrl }, "Image uploaded successfully");
  } catch (err) {
    next(err);
  }
};

export const whoami = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }
    const user = await getUserById(req.user.userId);
    sendSuccess(res, user, "User retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const body = req.body || {};
    const updateData: any = {};
    if (body.username) updateData.username = String(body.username).trim();
    if (body.email) updateData.email = String(body.email).trim().toLowerCase();
    if (body.gender) updateData.gender = body.gender;
    if (body.profileImage !== undefined) updateData.profileImage = body.profileImage;
    if (req.file) {
      updateData.profileImage = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const user = await updateUserProfile(req.user.userId, updateData);
    sendSuccess(res, user, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const body = req.body || {};
    const { currentPassword, newPassword } = body;
    if (!currentPassword || !newPassword) {
      throw new HttpException(400, "Current password and new password are required");
    }

    const result = await updateUserPassword(
      req.user.userId,
      String(currentPassword),
      String(newPassword)
    );
    sendSuccess(res, result, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body as { email?: unknown };
    if (typeof email !== "string" || !email.trim()) {
      throw new HttpException(400, "A valid email address is required");
    }

    const result = await requestPasswordReset(email.trim().toLowerCase());
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = req.body as { token?: unknown; newPassword?: unknown };
    if (typeof token !== "string" || !token.trim()) {
      throw new HttpException(400, "Reset token is required");
    }
    if (typeof newPassword !== "string") {
      throw new HttpException(400, "New password is required");
    }

    const result = await resetPasswordService(token.trim(), newPassword);
    sendSuccess(res, result, result.message);
  } catch (err) {
    next(err);
  }
};
