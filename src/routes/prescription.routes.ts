import { Router } from "express";
import {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getActivePrescriptions,
  getExpiredPrescriptions,
  extractPrescriptionData,
} from "../controllers/prescription.controllers";
import { authorize } from "../middlewares/authorized.middleware";
import multer from "multer";

const router = Router();

// Configure multer for attachment uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]);
  },
});

const upload = multer({ storage });

// OCR extraction reads the file in-memory and never persists it — the user still
// re-submits the same file to POST/PUT (disk storage) when they actually save.
const extractUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// All prescription routes require authentication
router.use(authorize);

// Dashboard-specific endpoints (must come before /:id)
router.get("/active", getActivePrescriptions);
router.get("/expired", getExpiredPrescriptions);
router.post("/extract", extractUpload.single("attachment"), extractPrescriptionData);

// CRUD operations
router.post("/", upload.single("attachment"), createPrescription);
router.get("/", getPrescriptions);
router.get("/:id", getPrescriptionById);
router.put("/:id", upload.single("attachment"), updatePrescription);
router.delete("/:id", deletePrescription);

export default router;
