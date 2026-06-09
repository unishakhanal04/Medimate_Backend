import { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/user.services";
import { sendSuccess } from "../utils/apihelper.util";
import { AuthRequest } from "../middlewares/authorized.middleware";

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
    if (!req.user) {
      throw new Error("User not authenticated");
    }
    sendSuccess(res, req.user, "Profile retrieved successfully");
  } catch (err) {
    next(err);
  }
};