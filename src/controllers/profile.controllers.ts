import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { ProfileService } from "../services/profile.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";
import { UpdateProfileDTO, UpdatePreferencesDTO } from "../types/profile.type";

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const profile = await ProfileService.getProfile(req.user.userId);
    sendSuccess(res, profile, "Profile retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const data: UpdateProfileDTO = {
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      dateOfBirth: req.body.dateOfBirth,
      gender: req.body.gender,
      bloodGroup: req.body.bloodGroup,
      allergies: req.body.allergies,
      chronicDiseases: req.body.chronicDiseases,
      height: req.body.height,
      weight: req.body.weight,
      profileImage: req.body.profileImage,
    };

    const profile = await ProfileService.updateProfile(req.user.userId, data);
    sendSuccess(res, profile, "Profile updated successfully");
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: unknown;
      newPassword?: unknown;
    };

    if (typeof currentPassword !== "string" || typeof newPassword !== "string" || !currentPassword || !newPassword) {
      throw new HttpException(400, "Current password and new password are required");
    }

    const result = await ProfileService.updatePassword(req.user.userId, { currentPassword, newPassword });
    sendSuccess(res, result, "Password updated successfully");
  } catch (err) {
    next(err);
  }
};

export const updatePreferences = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const data: UpdatePreferencesDTO = {
      darkMode: req.body.darkMode,
      emailNotifications: req.body.emailNotifications,
      medicineReminders: req.body.medicineReminders,
      appointmentReminders: req.body.appointmentReminders,
    };

    const profile = await ProfileService.updatePreferences(req.user.userId, data);
    sendSuccess(res, profile, "Preferences updated successfully");
  } catch (err) {
    next(err);
  }
};
