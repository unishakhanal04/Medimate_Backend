import { Router } from "express";
import { authorize } from "../middlewares/authorized.middleware";
import {
  getAdherenceSeries,
  getMedicineWiseProgress,
  getRefillAlerts,
  getOverview,
  getAdherenceReport,
  getMedicinesReport,
  getPrescriptionsReport,
  getAppointmentsReport,
  getInsights,
} from "../controllers/reports.controllers";

const router = Router();
router.use(authorize);

// New Reports & Analytics endpoints
router.get("/overview", getOverview);
router.get("/adherence", getAdherenceReport);
router.get("/medicines", getMedicinesReport);
router.get("/prescriptions", getPrescriptionsReport);
router.get("/appointments", getAppointmentsReport);
router.get("/insights", getInsights);

// Existing endpoints — kept for backward compatibility (dashboard + Medicines page
// already depend on getRefillAlerts via reportsService)
router.get("/adherence-series", getAdherenceSeries);
router.get("/refill-alerts", getRefillAlerts);
router.get("/medicine-progress", getMedicineWiseProgress);

export default router;
