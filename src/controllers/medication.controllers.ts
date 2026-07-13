import { NextFunction, Response } from "express";
import { HttpException } from "../exceptions/http-exception";
import { AuthRequest } from "../middlewares/authorized.middleware";
import { MedicationModel } from "../models/medication.model";
import { sendSuccess } from "../utils/apihelper.util";

const id = (req: AuthRequest) => {
  if (!req.user?.userId) throw new HttpException(401, "User not authenticated");
  return req.user.userId;
};
export const listMedications = async (req: AuthRequest, res: Response, next: NextFunction) => { try { sendSuccess(res, await MedicationModel.find({ userId: id(req) }).sort({ createdAt: -1 })); } catch (e) { next(e); } };
export const createMedication = async (req: AuthRequest, res: Response, next: NextFunction) => { try {
  if (!req.body.name || !req.body.dosage) throw new HttpException(400, "Medicine name and dosage are required");
  sendSuccess(res, await MedicationModel.create({ ...req.body, userId: id(req) }), "Medicine added", 201);
} catch (e) { next(e); } };
export const updateMedication = async (req: AuthRequest, res: Response, next: NextFunction) => { try {
  const item = await MedicationModel.findOneAndUpdate({ _id: req.params.id, userId: id(req) }, req.body, { new: true, runValidators: true });
  if (!item) throw new HttpException(404, "Medicine not found"); sendSuccess(res, item, "Medicine updated");
} catch (e) { next(e); } };
export const takeMedication = async (req: AuthRequest, res: Response, next: NextFunction) => { try {
  const item = await MedicationModel.findOneAndUpdate({ _id: req.params.id, userId: id(req) }, { lastTakenAt: new Date() }, { new: true });
  if (!item) throw new HttpException(404, "Medicine not found"); sendSuccess(res, item, "Dose marked as taken");
} catch (e) { next(e); } };
export const deleteMedication = async (req: AuthRequest, res: Response, next: NextFunction) => { try {
  const item = await MedicationModel.findOneAndDelete({ _id: req.params.id, userId: id(req) });
  if (!item) throw new HttpException(404, "Medicine not found"); sendSuccess(res, { id: req.params.id }, "Medicine deleted");
} catch (e) { next(e); } };
