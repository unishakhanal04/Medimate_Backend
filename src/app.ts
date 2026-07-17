import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import userRoutes from "./routes/user.routes";
import prescriptionRoutes from "./routes/prescription.routes";
import adminUserRoutes from "./routes/admin.user.routes";
import medicationRoutes from "./routes/medication.routes";
import reminderRoutes from "./routes/reminder.routes";
import medicineRoutes from "./routes/medicine.routes";
import appointmentRoutes from "./routes/appointment.routes";
import emergencyContactRoutes from "./routes/emergency-contact.routes";
import reportsRoutes from "./routes/reports.routes";
import timelineRoutes from "./routes/timeline.routes";
import aiRoutes from "./routes/ai.routes";
import dashboardRoutes from "./routes/dashboard.routes";
import profileRoutes from "./routes/profile.routes";
import adminRoutes from "./routes/admin.routes";
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
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/admin/users", adminUserRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/v1/medicines", medicineRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/emergency-contacts", emergencyContactRoutes);
app.use("/api/v1/reports", reportsRoutes);
app.use("/api/v1/timeline", timelineRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/admin", adminRoutes);

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpException) {
    return sendError(res, err.message, err.status, err.errors);
  }
  console.error(err);
  sendError(res, "Internal server error", 500);
});

export default app;
