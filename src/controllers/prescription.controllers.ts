import { Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { PrescriptionService } from "../services/prescription.services";
import { sendSuccess } from "../utils/apihelper.util";
import { HttpException } from "../exceptions/http-exception";
import { CreatePrescriptionDTO, UpdatePrescriptionDTO } from "../types/prescription.type";

const parseMedicines = (raw: unknown): string[] | undefined => {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") return undefined;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    throw new HttpException(400, "Invalid medicines format");
  }
};

const buildAttachmentUrl = (file?: Express.Multer.File) =>
  file ? `http://localhost:5000/uploads/${file.filename}` : undefined;

const getRouteId = (value: string | string[] | undefined) => {
  if (!value) {
    throw new HttpException(400, "Prescription id is required");
  }
  return Array.isArray(value) ? value[0] : value;
};

export const createPrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const data: CreatePrescriptionDTO = {
      title: req.body.title,
      doctorName: req.body.doctorName,
      hospital: req.body.hospital,
      prescriptionDate: req.body.prescriptionDate,
      expiryDate: req.body.expiryDate,
      notes: req.body.notes,
      medicines: parseMedicines(req.body.medicines),
      attachmentUrl: buildAttachmentUrl(req.file),
    };

    const prescription = await PrescriptionService.createPrescription(req.user.userId, data);
    sendSuccess(res, prescription, "Prescription created successfully", 201);
  } catch (err) {
    next(err);
  }
};

export const getPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const prescriptions = await PrescriptionService.getPrescriptionsByUserId(req.user.userId);
    sendSuccess(res, prescriptions, "Prescriptions retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getPrescriptionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    const prescription = await PrescriptionService.getPrescriptionById(id, req.user.userId);
    sendSuccess(res, prescription, "Prescription retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const updatePrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    const data: UpdatePrescriptionDTO = {
      title: req.body.title,
      doctorName: req.body.doctorName,
      hospital: req.body.hospital,
      prescriptionDate: req.body.prescriptionDate,
      expiryDate: req.body.expiryDate,
      notes: req.body.notes,
      medicines: parseMedicines(req.body.medicines),
      attachmentUrl: buildAttachmentUrl(req.file),
    };

    const prescription = await PrescriptionService.updatePrescription(id, req.user.userId, data);
    sendSuccess(res, prescription, "Prescription updated successfully");
  } catch (err) {
    next(err);
  }
};

export const deletePrescription = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const id = getRouteId(req.params.id);
    await PrescriptionService.deletePrescription(id, req.user.userId);
    sendSuccess(res, { id }, "Prescription deleted successfully");
  } catch (err) {
    next(err);
  }
};

export const getActivePrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const prescriptions = await PrescriptionService.getActivePrescriptions(req.user.userId);
    sendSuccess(res, prescriptions, "Active prescriptions retrieved successfully");
  } catch (err) {
    next(err);
  }
};

export const getExpiredPrescriptions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new HttpException(401, "User not authenticated");
    }

    const prescriptions = await PrescriptionService.getExpiredPrescriptions(req.user.userId);
    sendSuccess(res, prescriptions, "Expired prescriptions retrieved successfully");
  } catch (err) {
    next(err);
  }
};
