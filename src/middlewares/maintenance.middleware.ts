import { Request, Response, NextFunction } from "express";
import { SystemSettingsService } from "../services/system-settings.services";

const EXEMPT_PREFIXES = ["/health", "/api/v1/auth", "/api/auth", "/api/v1/admin", "/api/v1/system"];

export const maintenanceGate = async (req: Request, res: Response, next: NextFunction) => {
  if (EXEMPT_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    return next();
  }

  try {
    const maintenanceMode = await SystemSettingsService.getMaintenanceMode();
    if (maintenanceMode) {
      res.status(503).json({
        success: false,
        message: "MediMate is currently under maintenance. Please check back soon.",
      });
      return;
    }
    next();
  } catch (err) {
    // Fail open: a settings-lookup error should never take down the whole API.
    next();
  }
};
