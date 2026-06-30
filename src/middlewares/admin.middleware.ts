import { Response, NextFunction } from "express";
import { UserRepository } from "../repositories/user.repository";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "./authorized.middleware";

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) {
      return next(new HttpException(401, "User not authenticated"));
    }

    const user = await UserRepository.findById(req.user.userId);
    if (!user) {
      return next(new HttpException(401, "User not found"));
    }

    if (user.role !== "admin") {
      return next(new HttpException(403, "Admin access is required"));
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};
