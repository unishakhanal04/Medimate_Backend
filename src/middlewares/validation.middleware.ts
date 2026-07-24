import { Request, Response, NextFunction } from "express";
import { HttpException } from "../exceptions/http-exception";

const isValidEmail = (value: unknown): value is string => {
  return (
    typeof value === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  );
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isValidGender = (value: unknown): value is "male" | "female" | "other" => {
  return value === "male" || value === "female" || value === "other";
};

export const validateRegister = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors: Record<string, string> = {};
  const { username, email, gender, password } = req.body as {
    username: unknown;
    email: unknown;
    gender: unknown;
    password: unknown;
  };

  if (!isNonEmptyString(username) || username.trim().length < 2) {
    errors.username = "Username is required and must be at least 2 characters";
  }

  if (!isValidEmail(email)) {
    errors.email = "A valid email address is required";
  }

  if (!isValidGender(gender)) {
    errors.gender = "Please select a valid gender";
  }

  if (!isNonEmptyString(password) || password.trim().length < 6) {
    errors.password = "Password is required and must be at least 6 characters";
  }

  if (Object.keys(errors).length > 0) {
    return next(new HttpException(400, "Validation error", errors));
  }

  req.body = {
    ...req.body,
    username: (username as string).trim(),
    email: (email as string).trim().toLowerCase(),
    password: password as string,
    gender,
  };

  next();
};

const isValidPortal = (value: unknown): value is "user" | "admin" => {
  return value === "user" || value === "admin";
};

export const validateLogin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const errors: Record<string, string> = {};
  const { email, password, portal } = req.body as {
    email: unknown;
    password: unknown;
    portal: unknown;
  };

  if (!isValidEmail(email)) {
    errors.email = "A valid email address is required";
  }

  if (!isNonEmptyString(password)) {
    errors.password = "Password is required";
  }

  if (portal !== undefined && !isValidPortal(portal)) {
    errors.portal = "Portal must be either 'user' or 'admin'";
  }

  if (Object.keys(errors).length > 0) {
    return next(new HttpException(400, "Validation error", errors));
  }

  req.body = {
    ...req.body,
    email: (email as string).trim().toLowerCase(),
    password: password as string,
    ...(isValidPortal(portal) ? { portal } : {}),
  };

  next();
};
