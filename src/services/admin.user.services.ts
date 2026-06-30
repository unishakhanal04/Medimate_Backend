import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { UserRepository } from "../repositories/user.repository";
import {
  AdminCreateUserDTO,
  AdminUpdateUserDTO,
  UserGender,
  UserListQuery,
  UserListResult,
  UserRole,
  UserStatus,
} from "../types/user.type";
import { toPublicUser } from "./user.services";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_GENDERS: UserGender[] = ["male", "female", "other"];
const VALID_ROLES: UserRole[] = ["user", "admin"];
const VALID_STATUSES: UserStatus[] = ["active", "inactive"];

const ensureValidObjectId = (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpException(400, "Invalid user id");
  }
};

const normalizeUsername = (username: string) => username.trim();
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const validateGender = (gender: string) => {
  if (!VALID_GENDERS.includes(gender as UserGender)) {
    throw new HttpException(400, "Gender must be male, female, or other");
  }
};

const validateRole = (role: string) => {
  if (!VALID_ROLES.includes(role as UserRole)) {
    throw new HttpException(400, "Role must be user or admin");
  }
};

const validateStatus = (status: string) => {
  if (!VALID_STATUSES.includes(status as UserStatus)) {
    throw new HttpException(400, "Status must be active or inactive");
  }
};

const validateUsername = (username: string) => {
  if (normalizeUsername(username).length < 3) {
    throw new HttpException(400, "Username must be at least 3 characters");
  }
};

const validateEmail = (email: string) => {
  if (!EMAIL_REGEX.test(normalizeEmail(email))) {
    throw new HttpException(400, "A valid email is required");
  }
};

const validatePassword = (password: string) => {
  if (password.trim().length < 6) {
    throw new HttpException(400, "Password must be at least 6 characters");
  }
};

export const listUsersForAdmin = async (query: Partial<UserListQuery>): Promise<UserListResult> => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const search = typeof query.search === "string" ? query.search : undefined;

  return UserRepository.findUsers({ page, limit, search });
};

export const getAdminUserById = async (userId: string) => {
  ensureValidObjectId(userId);

  const user = await UserRepository.findById(userId);
  if (!user) {
    throw new HttpException(404, "User not found");
  }

  return toPublicUser(user);
};

export const createUserByAdmin = async (dto: AdminCreateUserDTO) => {
  if (!dto.username || !dto.email || !dto.gender || !dto.password) {
    throw new HttpException(400, "Username, email, gender, and password are required");
  }

  const normalizedUsername = normalizeUsername(dto.username);
  const normalizedEmail = normalizeEmail(dto.email);
  const role = dto.role ?? "user";
  const status = dto.status ?? "active";

  validateUsername(normalizedUsername);
  validateEmail(normalizedEmail);
  validateGender(dto.gender);
  validateRole(role);
  validateStatus(status);
  validatePassword(dto.password);

  const exists = await UserRepository.existsByEmail(normalizedEmail);
  if (exists) {
    throw new HttpException(409, "Email already in use");
  }

  const hashedPassword = await bcrypt.hash(dto.password, CONSTANTS.BCRYPT_ROUNDS);
  const user = await UserRepository.create({
    username: normalizedUsername,
    email: normalizedEmail,
    gender: dto.gender,
    password: hashedPassword,
    profileImage: dto.profileImage ?? null,
    role,
    status,
  });

  return toPublicUser(user);
};

export const updateUserByAdmin = async (userId: string, dto: AdminUpdateUserDTO) => {
  ensureValidObjectId(userId);

  const currentUser = await UserRepository.findById(userId);
  if (!currentUser) {
    throw new HttpException(404, "User not found");
  }

  const updateData: AdminUpdateUserDTO = {};

  if (dto.username !== undefined) {
    const normalizedUsername = normalizeUsername(dto.username);
    validateUsername(normalizedUsername);
    updateData.username = normalizedUsername;
  }

  if (dto.email !== undefined) {
    const normalizedEmail = normalizeEmail(dto.email);
    validateEmail(normalizedEmail);

    const exists = await UserRepository.existsByEmail(normalizedEmail, userId);
    if (exists) {
      throw new HttpException(409, "Email already in use");
    }

    updateData.email = normalizedEmail;
  }

  if (dto.gender !== undefined) {
    validateGender(dto.gender);
    updateData.gender = dto.gender;
  }

  if (dto.role !== undefined) {
    validateRole(dto.role);
    updateData.role = dto.role;
  }

  if (dto.status !== undefined) {
    validateStatus(dto.status);
    updateData.status = dto.status;
  }

  if (dto.profileImage !== undefined) {
    updateData.profileImage = dto.profileImage;
  }

  if (Object.keys(updateData).length === 0) {
    throw new HttpException(400, "No valid user fields provided");
  }

  const updatedUser = await UserRepository.update(userId, updateData);
  if (!updatedUser) {
    throw new HttpException(404, "User not found");
  }

  return toPublicUser(updatedUser);
};

export const deleteUserByAdmin = async (targetUserId: string, adminUserId: string) => {
  ensureValidObjectId(targetUserId);

  if (targetUserId === adminUserId) {
    throw new HttpException(400, "You cannot delete your own admin account");
  }

  const deletedUser = await UserRepository.deleteById(targetUserId);
  if (!deletedUser) {
    throw new HttpException(404, "User not found");
  }

  return { id: deletedUser._id.toString() };
};
