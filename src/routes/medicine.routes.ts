import { Router } from "express";
import {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  getTodayMedicines,
  markMedicineAsTaken,
  getAdherenceStats,
} from "../controllers/medicine.controllers";
import { authorize } from "../middlewares/authorized.middleware";

const router = Router();

// All medicine routes require authentication
router.use(authorize);

// Dashboard-specific endpoints (must come before /:id)
router.get("/today/list", getTodayMedicines);
router.get("/stats/adherence", getAdherenceStats);

// CRUD operations
router.post("/", createMedicine);
router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);
router.post("/:id/take", markMedicineAsTaken);

export default router;
