import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/user.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import adminUserRoutes from "./routes/admin.user.routes";
import { sendError } from "./utils/apihelper.util";
import { HttpException } from "./exceptions/http-exception";

const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(express.json());

// Serve uploads directory as static files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "MediMate API is running" });
});

// API routes
app.use("/api/v1/auth", userRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpException) {
    return sendError(res, err.message, err.status, err.errors);
  }
  console.error(err);
  sendError(res, "Internal server error", 500);
});

export default app;
