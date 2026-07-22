import { Router } from "express";
import { SystemSettingsService } from "../services/system-settings.services";
import { sendSuccess } from "../utils/apihelper.util";

const router = Router();

router.get("/maintenance-status", async (_req, res, next) => {
  try {
    const maintenanceMode = await SystemSettingsService.getMaintenanceMode();
    sendSuccess(res, { maintenanceMode }, "Maintenance status retrieved successfully");
  } catch (err) {
    next(err);
  }
});

export default router;
