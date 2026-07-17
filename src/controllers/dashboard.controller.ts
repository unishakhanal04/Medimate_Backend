import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { DashboardService } from "../services/dashboard.service";
import { sendSuccess } from "../utils/apihelper.util";

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const dashboard = await DashboardService.getDashboardData(req.user.userId);
    sendSuccess(res, dashboard, "Dashboard data retrieved successfully");
  } catch (err) {
    next(err);
  }
};
