import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/user.repository";
import { RegisterDTO, LoginDTO, JwtPayload } from "../types/user.type";
import { CONSTANTS } from "../config/constant";
import { HttpException } from "../exceptions/http-exception";
import { IUserDocument } from "../models/user.model";

const toPublicUser = (user: IUserDocument) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  gender: user.gender,
  dateOfBirth: user.dateOfBirth,
});

const createAuthResponse = (user: IUserDocument) => {
  const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
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
    dateOfBirth: dto.dateOfBirth,
    password: hashed,
  });

  return createAuthResponse(user);
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
