import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import {
  getDashboardSummary,
  getReportsOverview,
  getSystemHealth,
  listUsers,
  getAuditLogs,
  logReportExport,
  getAdminNotifications,
  markAdminNotificationsSeen,
  listFeedback,
  updateFeedbackStatus,
  getSystemSettings,
  updateMaintenanceMode,
  getUserDetails,
  getUserActivity,
  updateUserStatus,
} from "../controllers/admin.controllers";

const router = Router();

router.use(authorize, requireAdmin);

router.get("/dashboard-summary", getDashboardSummary);
router.get("/reports-overview", getReportsOverview);
router.get("/system-health", getSystemHealth);
router.get("/audit-logs", getAuditLogs);
router.post("/audit-logs/report-export", logReportExport);
router.get("/notifications", getAdminNotifications);
router.post("/notifications/mark-seen", markAdminNotificationsSeen);
router.get("/feedback", listFeedback);
router.patch("/feedback/:id/status", updateFeedbackStatus);
router.get("/system-settings", getSystemSettings);
router.patch("/system-settings/maintenance-mode", updateMaintenanceMode);

// Mounted as "/members" rather than "/users" so this router can sit alongside
// the pre-existing full user-CRUD router at /api/v1/admin/users without its
// GET/PATCH routes shadowing (or being shadowed by) that one.
router.get("/members", listUsers);
router.get("/members/:id", getUserDetails);
router.get("/members/:id/activity", getUserActivity);
router.patch("/members/:id/status", updateUserStatus);

export default router;
