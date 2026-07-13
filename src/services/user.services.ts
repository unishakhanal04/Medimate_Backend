import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { RegisterDTO, LoginDTO, JwtPayload, PublicUser } from "../types/user.type";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { IUserDocument } from "../models/user.model";

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
  await UserRepository.update(userId, { password: hashed });

  return { message: "Password updated successfully" };
};
