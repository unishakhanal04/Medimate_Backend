import { MedicineRepository } from "../repositories/medicine.repository";
import { HttpException } from "../exceptions/http-exception";
import {
  IMedicine,
  CreateMedicineDTO,
  UpdateMedicineDTO,
  TodayMedicine,
  AdherenceStats,
  AdherenceSeriesPoint,
  RefillAlert,
  MedicineProgress,
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
      quantity: data.quantity,
      refillThreshold: data.refillThreshold,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      mealInstruction: data.mealInstruction,
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
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.refillThreshold !== undefined) updateData.refillThreshold = data.refillThreshold;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : undefined;
    if (data.mealInstruction !== undefined) updateData.mealInstruction = data.mealInstruction;

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

  async getAdherenceSeries(
    userId: string,
    period: "daily" | "weekly",
    buckets: number
  ): Promise<AdherenceSeriesPoint[]> {
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);

    // Medicine start/end dates are stored from date-only strings (parsed as UTC
    // midnight), so their calendar day must be read via UTC getters. "Today" and
    // the report's day buckets are real local calendar days (the server's own
    // notion of "today"), read via local getters. Comparing calendar-day keys
    // (not absolute instants) avoids drift from the server's UTC offset.
    const localDayKey = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const storedDayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    const scheduledForDay = (dayKey: number) => {
      let count = 0;
      for (const medicine of activeMedicines) {
        const startKey = storedDayKey(new Date(medicine.startDate));
        const endKey = medicine.endDate ? storedDayKey(new Date(medicine.endDate)) : null;
        if (dayKey < startKey || (endKey !== null && dayKey > endKey)) continue;
        if (medicine.frequency === "daily" || medicine.frequency === "weekly") {
          count += medicine.times.length;
        }
      }
      return count;
    };

    const points: AdherenceSeriesPoint[] = [];

    if (period === "daily") {
      for (let i = buckets - 1; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        dayStart.setDate(dayStart.getDate() - i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const logs = await MedicineRepository.findLogsByUserId(userId, dayStart, dayEnd);
        const taken = logs.filter((log) => log.status === "taken").length;
        const scheduled = scheduledForDay(localDayKey(dayStart));
        const missed = Math.max(scheduled - taken, 0);
        const percentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

        points.push({
          label: dayStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          scheduled,
          taken,
          missed,
          percentage,
        });
      }
    } else {
      for (let i = buckets - 1; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setHours(23, 59, 59, 999);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        const logs = await MedicineRepository.findLogsByUserId(userId, weekStart, weekEnd);
        const taken = logs.filter((log) => log.status === "taken").length;

        let scheduled = 0;
        for (let d = 0; d < 7; d++) {
          const day = new Date(weekStart);
          day.setDate(day.getDate() + d);
          scheduled += scheduledForDay(localDayKey(day));
        }
        const missed = Math.max(scheduled - taken, 0);
        const percentage = scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;

        points.push({
          label: `Week of ${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
          scheduled,
          taken,
          missed,
          percentage,
        });
      }
    }

    return points;
  },

  async getRefillAlerts(userId: string): Promise<RefillAlert[]> {
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);

    return activeMedicines
      .filter(
        (medicine) =>
          medicine.quantity !== undefined &&
          medicine.quantity !== null &&
          medicine.quantity <= (medicine.refillThreshold ?? 5)
      )
      .map((medicine) => ({
        _id: medicine._id.toString(),
        name: medicine.name,
        dosage: medicine.dosage,
        quantity: medicine.quantity as number,
        refillThreshold: medicine.refillThreshold ?? 5,
      }));
  },

  async getMonthlyAdherenceTrend(userId: string): Promise<{ currentPercent: number; previousPercent: number }> {
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);

    const localDayKey = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    const storedDayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    const scheduledForDay = (dayKey: number) => {
      let count = 0;
      for (const medicine of activeMedicines) {
        const startKey = storedDayKey(new Date(medicine.startDate));
        const endKey = medicine.endDate ? storedDayKey(new Date(medicine.endDate)) : null;
        if (dayKey < startKey || (endKey !== null && dayKey > endKey)) continue;
        if (medicine.frequency === "daily" || medicine.frequency === "weekly") {
          count += medicine.times.length;
        }
      }
      return count;
    };

    const percentForWindow = async (daysAgoStart: number, daysAgoEnd: number) => {
      const end = new Date();
      end.setDate(end.getDate() - daysAgoStart);
      end.setHours(23, 59, 59, 999);
      const start = new Date();
      start.setDate(start.getDate() - daysAgoEnd);
      start.setHours(0, 0, 0, 0);

      const logs = await MedicineRepository.findLogsByUserId(userId, start, end);
      const taken = logs.filter((log) => log.status === "taken").length;

      let scheduled = 0;
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        scheduled += scheduledForDay(localDayKey(d));
      }

      return scheduled > 0 ? Math.round((taken / scheduled) * 100) : 0;
    };

    const [currentPercent, previousPercent] = await Promise.all([
      percentForWindow(0, 29),
      percentForWindow(30, 59),
    ]);

    return { currentPercent, previousPercent };
  },

  async getBestAdherenceDay(userId: string, days: number = 60): Promise<{ day: string; percentage: number } | null> {
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);
    const today = new Date();
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - days);
    rangeStart.setHours(0, 0, 0, 0);

    const logs = await MedicineRepository.findLogsByUserId(userId, rangeStart, today);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const takenByDow = new Array(7).fill(0);
    const scheduledByDow = new Array(7).fill(0);

    const storedDayKey = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

    for (let d = new Date(rangeStart); d <= today; d.setDate(d.getDate() + 1)) {
      const dayKey = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
      const dow = d.getDay();
      for (const medicine of activeMedicines) {
        const startKey = storedDayKey(new Date(medicine.startDate));
        const endKey = medicine.endDate ? storedDayKey(new Date(medicine.endDate)) : null;
        if (dayKey < startKey || (endKey !== null && dayKey > endKey)) continue;
        if (medicine.frequency === "daily" || medicine.frequency === "weekly") {
          scheduledByDow[dow] += medicine.times.length;
        }
      }
    }

    for (const log of logs) {
      if (log.status !== "taken") continue;
      takenByDow[new Date(log.takenAt).getDay()]++;
    }

    let bestIndex = -1;
    let bestPercentage = -1;
    for (let i = 0; i < 7; i++) {
      if (scheduledByDow[i] === 0) continue;
      const percentage = Math.round((takenByDow[i] / scheduledByDow[i]) * 100);
      if (percentage > bestPercentage) {
        bestPercentage = percentage;
        bestIndex = i;
      }
    }

    if (bestIndex === -1) return null;
    return { day: dayNames[bestIndex], percentage: bestPercentage };
  },

  async getMedicineWiseProgress(userId: string, days: number): Promise<MedicineProgress[]> {
    const activeMedicines = await MedicineRepository.findActiveByUserId(userId);
    const today = new Date();
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - days);

    const logs = await MedicineRepository.findLogsByUserId(userId, rangeStart, today);

    return activeMedicines.map((medicine) => {
      const dosesTaken = logs.filter(
        (log) => log.medicineId === medicine._id.toString() && log.status === "taken"
      ).length;

      let dosesScheduled = 0;
      if (medicine.frequency === "daily" || medicine.frequency === "weekly") {
        const medicineStart = new Date(medicine.startDate);
        const effectiveStart = medicineStart > rangeStart ? medicineStart : rangeStart;
        const activeDays = Math.max(
          Math.ceil((today.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24)),
          0
        );
        dosesScheduled = activeDays * medicine.times.length;
      }

      const adherencePercentage = dosesScheduled > 0 ? Math.round((dosesTaken / dosesScheduled) * 100) : 0;

      return {
        medicineId: medicine._id.toString(),
        name: medicine.name,
        adherencePercentage,
        dosesTaken,
        dosesScheduled,
      };
    });
  },
};
