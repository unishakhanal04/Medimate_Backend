import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { AdminService } from "../services/admin.services";
import { AuditLogService } from "../services/audit-log.services";
import { AdminNotificationService } from "../services/admin-notification.services";
import { SystemSettingsService } from "../services/system-settings.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";

const getRouteId = (value: string | string[] | undefined) => {
  if (!value) {
    throw new HttpException(400, "User id is required");
  }
  return Array.isArray(value) ? value[0] : value;
};

export const getDashboardSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const summary = await AdminService.getDashboardSummary();
    sendSuccess(res, summary, "Dashboard summary retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getReportsOverview = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const overview = await AdminService.getReportsOverview();
    sendSuccess(res, overview, "Reports overview retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getSubscriptionStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getSubscriptionStats();
    sendSuccess(res, stats, "Subscription stats retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const listSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status =
      req.query.status === "active" || req.query.status === "expired" || req.query.status === "cancelled"
        ? req.query.status
        : undefined;

    const result = await AdminService.listSubscriptions({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      status,
    });
    sendSuccess(res, result, "Subscriptions retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const listPayments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const status =
      req.query.status === "pending" || req.query.status === "success" || req.query.status === "failed"
        ? req.query.status
        : undefined;

    const result = await AdminService.listPayments({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      status,
    });
    sendSuccess(res, result, "Payments retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await AuditLogService.getLogs({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      action: typeof req.query.action === "string" ? req.query.action : undefined,
      adminId: typeof req.query.adminId === "string" ? req.query.adminId : undefined,
    });
    sendSuccess(res, logs, "Audit logs retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const logReportExport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    await AuditLogService.log({
      adminId: req.user.userId,
      action: "report_exported",
      targetType: "report",
      description: "Exported reports (CSV)",
    });
    sendSuccess(res, { logged: true }, "Export logged successfully");
  } catch (err) {
    next(err);
  }
};

export const getAdminNotifications = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const result = await AdminNotificationService.getNotifications(req.user.userId);
    sendSuccess(res, result, "Notifications retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const markAdminNotificationsSeen = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const result = await AdminNotificationService.markAllSeen(req.user.userId);
    sendSuccess(res, result, "Notifications marked as read");
  } catch (err) {
    next(err);
  }
};

export const listFeedback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const type =
      req.query.type === "bug_report" ||
      req.query.type === "suggestion" ||
      req.query.type === "feature_request" ||
      req.query.type === "general"
        ? req.query.type
        : undefined;
    const status =
      req.query.status === "new" || req.query.status === "reviewed" || req.query.status === "resolved"
        ? req.query.status
        : undefined;

    const result = await AdminService.listFeedback({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      type,
      status,
    });
    sendSuccess(res, result, "Feedback retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateFeedbackStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (status !== "new" && status !== "reviewed" && status !== "resolved") {
      throw new HttpException(400, "Status must be new, reviewed, or resolved");
    }

    const updated = await AdminService.updateFeedbackStatus(getRouteId(req.params.id), status);
    sendSuccess(res, updated, "Feedback status updated successfully");
  } catch (err) {
    next(err);
  }
};

export const getSystemSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const settings = await SystemSettingsService.getSummary();
    sendSuccess(res, settings, "System settings retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateMaintenanceMode = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      throw new HttpException(400, "enabled must be a boolean");
    }

    const maintenanceMode = await SystemSettingsService.setMaintenanceMode(enabled);
    sendSuccess(res, { maintenanceMode }, "Maintenance mode updated successfully");
  } catch (err) {
    next(err);
  }
};

export const getSystemHealth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const health = await AdminService.getSystemHealth();
    sendSuccess(res, health, "System health retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await AdminService.listUsers({
      page: Number(req.query.page),
      limit: Number(req.query.limit),
      search: typeof req.query.search === "string" ? req.query.search : undefined,
      status: req.query.status === "active" || req.query.status === "inactive" ? req.query.status : undefined,
      sort: req.query.sort === "mostActive" ? "mostActive" : undefined,
    });
    sendSuccess(res, result, "Users retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserDetails = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req.params.id);
    const user = await AdminService.getUserDetails(id);
    sendSuccess(res, user, "User details retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getUserActivity = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getRouteId(req.params.id);
    const activity = await AdminService.getUserActivity(id);
    sendSuccess(res, activity, "User activity retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (status !== "active" && status !== "inactive") {
      throw new HttpException(400, "Status must be active or inactive");
    }

    if (!req.user?.userId) throw new HttpException(401, "User not authenticated");

    const user = await AdminService.updateUserStatus(getRouteId(req.params.id), status, req.user.userId);
    sendSuccess(res, user, "User status updated successfully");
  } catch (err) {
    next(err);
  }
};
