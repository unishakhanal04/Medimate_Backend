import { Request, Response, NextFunction } from "express";
import { PrescriptionModel } from "../models/prescription.model";
import { sendSuccess } from "../utils/apihelper.util";
import { AuthRequest } from "../middlewares/authorized.middleware";

export const uploadPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      throw new Error("No file uploaded");
    }

    if (!req.user) {
      throw new Error("User not authenticated");
    }

    // Create image URL (using local storage for now)
    const imageUrl = `http://10.0.2.2:5000/uploads/${req.file.filename}`;

    // Create prescription record
    const prescription = await PrescriptionModel.create({
      userId: req.user.userId,
      imageUrl: imageUrl,
      uploadDate: new Date(),
      notes: req.body.notes || "",
      medicineName: req.body.medicineName || "",
      medicineTime: req.body.medicineTime || "",
    });

    sendSuccess(res, prescription, "Prescription uploaded successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getUserPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new Error("User not authenticated");
    }

    const prescriptions = await PrescriptionModel.find({ userId: req.user.userId }).sort({ uploadDate: -1 });
    
    sendSuccess(res, prescriptions, "Prescriptions retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const deletePrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!req.user) {
      throw new Error("User not authenticated");
    }

    // Find prescription and verify ownership
    const prescription = await PrescriptionModel.findOne({ _id: id, userId: req.user.userId });
    
    if (!prescription) {
      throw new Error("Prescription not found or unauthorized");
    }

    await PrescriptionModel.findByIdAndDelete(id);
    
    sendSuccess(res, { id }, "Prescription deleted successfully");
  } catch (err) {
    next(err);
  }
};
