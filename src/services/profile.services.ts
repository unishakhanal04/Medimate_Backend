import bcrypt from "bcryptjs";
import { ProfileRepository } from "../repositories/profile.repository";
import { UserRepository } from "../repositories/user.repository";
import { HttpException } from "../exceptions/http-exception";
import { CONSTANTS } from "../config/constant";
import { IUserDocument } from "../models/user.model";
import { IUser, IUserPreferences } from "../types/user.type";
import { ProfileData, UpdateProfileDTO, UpdatePasswordDTO, UpdatePreferencesDTO } from "../types/profile.type";

const DEFAULT_PREFERENCES: IUserPreferences = {
  darkMode: false,
  emailNotifications: true,
  medicineReminders: true,
  appointmentReminders: true,
};

const toProfileData = (user: IUserDocument): ProfileData => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
  gender: user.gender,
  profileImage: user.profileImage,
  phone: user.phone,
  dateOfBirth: user.dateOfBirth,
  bloodGroup: user.bloodGroup,
  allergies: user.allergies ?? [],
  chronicDiseases: user.chronicDiseases ?? [],
  height: user.height,
  weight: user.weight,
  preferences: user.preferences ?? DEFAULT_PREFERENCES,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const ProfileService = {
  async getProfile(userId: string) {
    const user = await ProfileRepository.findById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }
    return toProfileData(user);
  },

  async updateProfile(userId: string, data: UpdateProfileDTO) {
    const user = await ProfileRepository.findById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }

    if (data.email && data.email.trim().toLowerCase() !== user.email) {
      const exists = await UserRepository.existsByEmail(data.email);
      if (exists) {
        throw new HttpException(409, "Email already in use");
      }
    }

    const updateData: Partial<IUser> = {};
    if (data.username !== undefined) updateData.username = data.username.trim();
    if (data.email !== undefined) updateData.email = data.email.trim().toLowerCase();
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.bloodGroup !== undefined) updateData.bloodGroup = data.bloodGroup;
    if (data.allergies !== undefined) updateData.allergies = data.allergies;
    if (data.chronicDiseases !== undefined) updateData.chronicDiseases = data.chronicDiseases;
    if (data.height !== undefined) updateData.height = data.height;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.profileImage !== undefined) updateData.profileImage = data.profileImage;

    const updatedUser = await ProfileRepository.update(userId, updateData);
    if (!updatedUser) {
      throw new HttpException(404, "User not found");
    }
    return toProfileData(updatedUser);
  },

  async updatePassword(userId: string, data: UpdatePasswordDTO) {
    const user = await ProfileRepository.findById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }

    if (data.newPassword.trim().length < 6) {
      throw new HttpException(400, "New password must be at least 6 characters");
    }

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new HttpException(401, "Current password is incorrect");
    }

    const hashed = await bcrypt.hash(data.newPassword, CONSTANTS.BCRYPT_ROUNDS);
    await ProfileRepository.update(userId, { password: hashed });

    return { message: "Password updated successfully" };
  },

  async updatePreferences(userId: string, data: UpdatePreferencesDTO) {
    const user = await ProfileRepository.findById(userId);
    if (!user) {
      throw new HttpException(404, "User not found");
    }

    // user.preferences is a live Mongoose subdocument, not a plain object —
    // spreading it directly leaks Mongoose internals ($__, _doc, etc.) into
    // the result, which corrupts how the update gets cast back onto the
    // schema. Convert to a plain object first.
    const rawPreferences = user.preferences as (IUserPreferences & { toObject?: () => IUserPreferences }) | undefined;
    const currentPreferences = rawPreferences?.toObject
      ? rawPreferences.toObject()
      : (rawPreferences ?? DEFAULT_PREFERENCES);

    const updatedPreferences: IUserPreferences = {
      ...currentPreferences,
      ...data,
    };

    const updatedUser = await ProfileRepository.update(userId, { preferences: updatedPreferences });
    if (!updatedUser) {
      throw new HttpException(404, "User not found");
    }
    return toProfileData(updatedUser);
  },
};
