import { Router } from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  getUpcomingAppointments,
  getPastAppointments,
} from "../controllers/appointment.controllers";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();

// All appointment routes require authentication
router.use(authorize);

// Dashboard-specific endpoints (must come before /:id)
router.get("/upcoming", getUpcomingAppointments);
router.get("/past", getPastAppointments);

// CRUD operations
router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
