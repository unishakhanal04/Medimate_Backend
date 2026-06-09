import { Response } from "express";

export const sendSuccess = (res: Response, data: unknown, message = "Success", statusCode = 200) => {
  res.status(statusCode).json({ success: true, message, data });
};

export const sendError = (
  res: Response,
  message = "Error",
  statusCode = 500,
  errors?: Record<string, string>
) => {
  const body: Record<string, unknown> = { success: false, message };
  if (errors) {
    body.errors = errors;
  }
  res.status(statusCode).json(body);
};
