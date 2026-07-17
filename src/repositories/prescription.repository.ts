import { PrescriptionModel } from "../models/prescription.model";
import { IPrescription } from "../types/prescription.type";

export const PrescriptionRepository = {
  async create(prescriptionData: Omit<IPrescription, "_id" | "createdAt" | "updatedAt">) {
    const prescription = await PrescriptionModel.create(prescriptionData);
    return prescription.toObject();
  },

  async findById(id: string) {
    return await PrescriptionModel.findById(id);
  },

  async findByUserId(userId: string) {
    return await PrescriptionModel.find({ userId }).sort({ prescriptionDate: -1 });
  },

  async update(id: string, updateData: Partial<IPrescription>) {
    return await PrescriptionModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
  },

  async deleteById(id: string) {
    return await PrescriptionModel.findByIdAndDelete(id);
  },
};
