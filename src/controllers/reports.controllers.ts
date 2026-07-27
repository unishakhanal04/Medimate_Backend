import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { MedicineService } from "../services/medicine.services";
import { ReportsService } from "../services/reports.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

// --- Existing endpoints (kept for backward compatibility — already consumed by the
// dashboard and Medicines page via reportsService.getRefillAlerts()) ---

export const getAdherenceSeries = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const period = req.query.period === "daily" ? "daily" : "weekly";
    const buckets = Math.min(Math.max(Number(req.query.buckets) || 8, 1), 52);

    const series = await MedicineService.getAdherenceSeries(req.user.userId, period, buckets);
    sendSuccess(res, series, "Adherence series retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getRefillAlerts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const alerts = await MedicineService.getRefillAlerts(req.user.userId);
    sendSuccess(res, alerts, "Refill alerts retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getMedicineWiseProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const progress = await MedicineService.getMedicineWiseProgress(req.user.userId, days);
    sendSuccess(res, progress, "Medicine progress retrieved successfully");
  } catch (err) {
    next(err);
  }
};

// --- New Reports & Analytics endpoints ---

export const getOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const overview = await ReportsService.getOverview(req.user.userId);
    sendSuccess(res, overview, "Reports overview retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getAdherenceReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const period = req.query.period === "weekly" ? "weekly" : "daily";
    const buckets = Math.min(Math.max(Number(req.query.buckets) || 14, 1), 52);

    const report = await ReportsService.getAdherenceReport(req.user.userId, period, buckets);
    sendSuccess(res, report, "Adherence report retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getMedicinesReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const report = await ReportsService.getMedicinesReport(req.user.userId, days);
    sendSuccess(res, report, "Medicines report retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const report = await ReportsService.getPrescriptionsReport(req.user.userId);
    sendSuccess(res, report, "Prescriptions report retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getAppointmentsReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const report = await ReportsService.getAppointmentsReport(req.user.userId);
    sendSuccess(res, report, "Appointments report retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const insights = await ReportsService.getInsights(req.user.userId);
    sendSuccess(res, { insights }, "Insights retrieved successfully");
  } catch (err) {
    next(err);
  }
};
