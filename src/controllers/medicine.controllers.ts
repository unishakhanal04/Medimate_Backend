import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { MedicineService } from "../services/medicine.services";
import { sendSuccess } from "../utils/apihelper.util";
import { CreateMedicineDTO, UpdateMedicineDTO } from "../types/medicine.type";

export const createMedicine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    console.log("Create medicine request:", req.body);
    console.log("User:", req.user);

    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const data: CreateMedicineDTO = req.body;
    const medicine = await MedicineService.createMedicine(req.user.userId, data);
    sendSuccess(res, medicine, "Medicine created successfully");
  } catch (err) {
    console.error("Create medicine error:", err);
    next(err);
  }
};

export const getMedicines = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const medicines = await MedicineService.getMedicinesByUserId(req.user.userId);
    sendSuccess(res, medicines, "Medicines retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getMedicineById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const { id } = req.params;
    const medicineId = Array.isArray(id) ? id[0] : id;
    const medicine = await MedicineService.getMedicineById(medicineId, req.user.userId);
    sendSuccess(res, medicine, "Medicine retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updateMedicine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const { id } = req.params;
    const medicineId = Array.isArray(id) ? id[0] : id;
    const data: UpdateMedicineDTO = req.body;
    const medicine = await MedicineService.updateMedicine(medicineId, req.user.userId, data);
    sendSuccess(res, medicine, "Medicine updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deleteMedicine = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const { id } = req.params;
    const medicineId = Array.isArray(id) ? id[0] : id;
    await MedicineService.deleteMedicine(medicineId, req.user.userId);
    sendSuccess(res, null, "Medicine deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const getTodayMedicines = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const medicines = await MedicineService.getTodayMedicines(req.user.userId);
    sendSuccess(res, medicines, "Today's medicines retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const markMedicineAsTaken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const { id } = req.params;
    const medicineId = Array.isArray(id) ? id[0] : id;
    const { scheduledTime } = req.body;

    if (!scheduledTime) {
      throw new Error("Scheduled time is required");
    }

    const log = await MedicineService.markMedicineAsTaken(medicineId, req.user.userId, scheduledTime);
    sendSuccess(res, log, "Medicine marked as taken");
  } catch (err) {
    next(err);
  }
};

export const getAdherenceStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user.userId) {
      throw new Error("User not authenticated");
    }

    const stats = await MedicineService.getAdherenceStats(req.user.userId);
    sendSuccess(res, stats, "Adherence stats retrieved successfully");
  } catch (err) {
    next(err);
  }
};
