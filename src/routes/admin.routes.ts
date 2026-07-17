import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import { requireAdmin } from "../middlewares/admin.middleware";
import {
  getDashboardSummary,
  getReportsOverview,
  listUsers,
  getUserDetails,
  updateUserStatus,
} from "../controllers/admin.controllers";

const router = Router();

router.use(authorize, requireAdmin);

router.get("/dashboard-summary", getDashboardSummary);
router.get("/reports-overview", getReportsOverview);

// Mounted as "/members" rather than "/users" so this router can sit alongside
// the pre-existing full user-CRUD router at /api/v1/admin/users without its
// GET/PATCH routes shadowing (or being shadowed by) that one.
router.get("/members", listUsers);
router.get("/members/:id", getUserDetails);
router.patch("/members/:id/status", updateUserStatus);

export default router;
