import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes";
import { sendError } from "./utils/apihelper.util";
import { HttpException } from "./exceptions/http-exception";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "MediMate API is running" });
});

// API routes
app.use("/api/auth", userRoutes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpException) {
    return sendError(res, err.message, err.status, err.errors);
  }
  console.error(err);
  sendError(res, "Internal server error", 500);
});

export default app;
