import { MedicineRepository } from "../repositories/medicine.repository";
import { HttpException } from "../exceptions/http-exception";
import {
  IMedicine,
  CreateMedicineDTO,
  UpdateMedicineDTO,
  TodayMedicine,
  AdherenceStats,
} from "../types/medicine.type";

export const MedicineService = {
  async createMedicine(userId: string, data: CreateMedicineDTO) {
    const medicineData: Omit<IMedicine, "_id" | "createdAt" | "updatedAt"> = {
      userId,
      name: data.name,
      dosage: data.dosage,
      frequency: data.frequency,
      times: data.times,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      notes: data.notes,
      status: "active",
    };

    const medicine = await MedicineRepository.create(medicineData);
    return medicine;
  },

  async getMedicinesByUserId(userId: string) {
    return await MedicineRepository.findByUserId(userId);
  },

  async getActiveMedicinesByUserId(userId: string) {
    return await MedicineRepository.findActiveByUserId(userId);
  },

  async getMedicineById(id: string, userId: string) {
    const medicine = await MedicineRepository.findById(id);
    if (!medicine) {
      throw new HttpException(404, "Medicine not found");
    }
    if (medicine.userId !== userId) {
      throw new HttpException(403, "Access denied");
    }
    return medicine;
  },

  async updateMedicine(id: string, userId: string, data: UpdateMedicineDTO) {
    const medicine = await this.getMedicineById(id, userId);

    const updateData: Partial<IMedicine> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.dosage !== undefined) updateData.dosage = data.dosage;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.times !== undefined) updateData.times = data.times;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : undefined;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedMedicine = await MedicineRepository.update(id, updateData);
    if (!updatedMedicine) {
      throw new HttpException(404, "Medicine not found");
    }
    return updatedMedicine;
  },

  async deleteMedicine(id: string, userId: string) {
    await this.getMedicineById(id, userId);
    await MedicineRepository.deleteById(id);
  },

  async getTodayMedicines(userId: string): Promise<TodayMedicine[]> {
    const today = new Date();
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);
    const todayLogs = await MedicineRepository.findTodayLogs(userId, today);

    const todayMedicines: TodayMedicine[] = [];

    for (const medicine of activeMedicines) {
      // Check if medicine is active for today
      const startDate = new Date(medicine.startDate);
      const endDate = medicine.endDate ? new Date(medicine.endDate) : null;

      if (today < startDate || (endDate && today > endDate)) {
        continue;
      }

      // Check frequency
      if (medicine.frequency === "daily") {
        for (const time of medicine.times) {
          const log = todayLogs.find(
            (l) => l.medicineId === medicine._id.toString() && l.scheduledTime === time
          );
          todayMedicines.push({
            _id: medicine._id.toString(),
            name: medicine.name,
            dosage: medicine.dosage,
            time,
            status: log ? (log.status === "taken" ? "taken" : "skipped") : "pending",
            logId: log?._id.toString(),
          });
        }
      } else if (medicine.frequency === "weekly") {
        const dayOfWeek = today.getDay();
        // Simple logic: if it's a weekly medicine, include it (you can add day-specific logic later)
        for (const time of medicine.times) {
          const log = todayLogs.find(
            (l) => l.medicineId === medicine._id.toString() && l.scheduledTime === time
          );
          todayMedicines.push({
            _id: medicine._id.toString(),
            name: medicine.name,
            dosage: medicine.dosage,
            time,
            status: log ? (log.status === "taken" ? "taken" : "skipped") : "pending",
            logId: log?._id.toString(),
          });
        }
      }
      // as_needed medicines are not shown in today's schedule
    }

    // Sort by time
    todayMedicines.sort((a, b) => a.time.localeCompare(b.time));

    return todayMedicines;
  },

  async markMedicineAsTaken(medicineId: string, userId: string, scheduledTime: string) {
    const medicine = await this.getMedicineById(medicineId, userId);
    const today = new Date();

    // Check if already logged for today
    const existingLog = await MedicineRepository.findLogByMedicineAndTime(
      medicineId,
      scheduledTime,
      today
    );

    if (existingLog) {
      // Update existing log
      existingLog.status = "taken";
      existingLog.takenAt = new Date();
      await existingLog.save();
      return existingLog.toObject();
    }

    // Create new log
    const log = await MedicineRepository.createLog({
      medicineId,
      userId,
      scheduledTime,
      status: "taken",
      takenAt: new Date(),
    });

    return log;
  },

  async getAdherenceStats(userId: string): Promise<AdherenceStats> {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await MedicineRepository.findLogsByUserId(userId, weekAgo, today);
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);

    // Calculate total scheduled doses for the week
    let totalScheduled = 0;
    for (const medicine of activeMedicines) {
      if (medicine.frequency === "daily") {
        totalScheduled += medicine.times.length * 7;
      } else if (medicine.frequency === "weekly") {
        totalScheduled += medicine.times.length;
      }
    }

    const medicinesTaken = logs.filter((log) => log.status === "taken").length;
    const weeklyAdherence = totalScheduled > 0 ? Math.round((medicinesTaken / totalScheduled) * 100) : 0;

    // Calculate streak (consecutive days with 100% adherence)
    let streak = 0;
    let checkDate = new Date(today);
    while (true) {
      const dayStart = new Date(checkDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(checkDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayLogs = await MedicineRepository.findLogsByUserId(userId, dayStart, dayEnd);
      // Simplified streak calculation - you can enhance this
      if (dayLogs.length > 0) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      weeklyAdherence,
      medicinesTaken,
      totalScheduled,
      streak,
    };
  },
};
