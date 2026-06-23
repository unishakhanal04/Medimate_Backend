import { Router } from "express";
import { uploadPrescription, getUserPrescriptions, deletePrescription } from "../controllers/prescription.controllers";
import { authorize } from "../middlewares/authorized.middleware";
import multer from "multer";

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.mimetype.split('/')[1]);
  }
});

const upload = multer({ storage: storage });

// Prescription routes
router.post("/upload", authorize, upload.single('image'), uploadPrescription);
router.get("/user/:userId", authorize, getUserPrescriptions);
router.delete("/:id", authorize, deletePrescription);

export default router;
