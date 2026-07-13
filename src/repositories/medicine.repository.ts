import { MedicineModel, MedicineLogModel } from "../models/medicine.model";
import { IMedicine, IMedicineLog, TodayMedicine } from "../types/medicine.type";

export const MedicineRepository = {
  async create(medicineData: Omit<IMedicine, "_id" | "createdAt" | "updatedAt">) {
    const medicine = await MedicineModel.create(medicineData);
    return medicine.toObject();
  },

  async findById(id: string) {
    return await MedicineModel.findById(id);
  },

  async findByUserId(userId: string) {
    return await MedicineModel.find({ userId }).sort({ createdAt: -1 });
  },

  async findActiveByUserId(userId: string) {
    return await MedicineModel.find({ userId, status: "active" }).sort({ name: 1 });
  },

  async update(id: string, updateData: Partial<IMedicine>) {
    return await MedicineModel.findByIdAndUpdate(id, updateData, { returnDocument: "after" });
  },

  async deleteById(id: string) {
    return await MedicineModel.findByIdAndDelete(id);
  },

  async createLog(logData: Omit<IMedicineLog, "_id" | "createdAt" | "updatedAt">) {
    const log = await MedicineLogModel.create(logData);
    return log.toObject();
  },

  async findLogsByMedicineId(medicineId: string, limit: number = 10) {
    return await MedicineLogModel.find({ medicineId })
      .sort({ takenAt: -1 })
      .limit(limit);
  },

  async findLogsByUserId(userId: string, startDate?: Date, endDate?: Date) {
    const query: any = { userId };
    if (startDate && endDate) {
      query.takenAt = { $gte: startDate, $lte: endDate };
    }
    return await MedicineLogModel.find(query).sort({ takenAt: -1 });
  },

  async findTodayLogs(userId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await MedicineLogModel.find({
      userId,
      takenAt: { $gte: startOfDay, $lte: endOfDay },
    });
  },

  async findLogByMedicineAndTime(medicineId: string, scheduledTime: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await MedicineLogModel.findOne({
      medicineId,
      scheduledTime,
      takenAt: { $gte: startOfDay, $lte: endOfDay },
    });
  },
};
