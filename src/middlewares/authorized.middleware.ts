import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONSTANTS } from "../config/constant";
import { JwtPayload } from "../types/user.type";
import { HttpException } from "../exceptions/http-exception";

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authorize = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new HttpException(401, "No token provided"));
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, CONSTANTS.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    next(new HttpException(401, "Invalid or expired token"));
  }
};
