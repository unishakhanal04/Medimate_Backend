import { ReportsRepository } from "../repositories/reports.repository";
import { MedicineService } from "./medicine.services";
import { PrescriptionService } from "./prescription.services";
import {
  ReportsOverview,
  AdherenceReport,
  MedicinesReport,
  PrescriptionsReport,
  AppointmentsReport,
  ReportsInsights,
} from "../types/reports.type";

export const ReportsService = {
  async getOverview(userId: string): Promise<ReportsOverview> {
    const [medicines, activeMedicines, prescriptions, activePrescriptions, appointmentCounts, adherenceStats, user] =
      await Promise.all([
        MedicineService.getMedicinesByUserId(userId),
        MedicineService.getActiveMedicinesByUserId(userId),
        PrescriptionService.getPrescriptionsByUserId(userId),
        PrescriptionService.getActivePrescriptions(userId),
        ReportsRepository.countAppointmentsByStatus(userId),
        MedicineService.getAdherenceStats(userId),
        ReportsRepository.findUserById(userId),
      ]);

    return {
      totalMedicines: medicines.length,
      activeMedicines: activeMedicines.length,
      totalPrescriptions: prescriptions.length,
      activePrescriptions: activePrescriptions.length,
      upcomingAppointments: appointmentCounts.scheduled,
      weeklyAdherence: adherenceStats.weeklyAdherence,
      currentStreak: adherenceStats.streak,
      memberSince: user?.createdAt,
    };
  },

  async getAdherenceReport(
    userId: string,
    period: "daily" | "weekly",
    buckets: number
  ): Promise<AdherenceReport> {
    const [stats, series] = await Promise.all([
      MedicineService.getAdherenceStats(userId),
      MedicineService.getAdherenceSeries(userId, period, buckets),
    ]);

    return {
      weeklyAdherence: stats.weeklyAdherence,
      medicinesTaken: stats.medicinesTaken,
      totalScheduled: stats.totalScheduled,
      streak: stats.streak,
      series,
    };
  },

  async getMedicinesReport(userId: string, progressDays: number): Promise<MedicinesReport> {
    const [allMedicines, refillAlerts, medicineProgress] = await Promise.all([
      MedicineService.getMedicinesByUserId(userId),
      MedicineService.getRefillAlerts(userId),
      MedicineService.getMedicineWiseProgress(userId, progressDays),
    ]);

    return {
      totalMedicines: allMedicines.length,
      activeMedicines: allMedicines.filter((m) => m.status === "active").length,
      inactiveMedicines: allMedicines.filter((m) => m.status === "inactive").length,
      completedMedicines: allMedicines.filter((m) => m.status === "completed").length,
      refillAlerts,
      medicineProgress,
    };
  },

  async getPrescriptionsReport(userId: string): Promise<PrescriptionsReport> {
    const [all, active, expired] = await Promise.all([
      PrescriptionService.getPrescriptionsByUserId(userId),
      PrescriptionService.getActivePrescriptions(userId),
      PrescriptionService.getExpiredPrescriptions(userId),
    ]);

    const activeIds = new Set(active.map((p) => p._id.toString()));
    const recentPrescriptions = all.slice(0, 5).map((p) => ({
      id: p._id.toString(),
      title: p.title,
      doctorName: p.doctorName,
      prescriptionDate: p.prescriptionDate,
      status: activeIds.has(p._id.toString()) ? ("active" as const) : ("expired" as const),
    }));

    return {
      totalPrescriptions: all.length,
      activePrescriptions: active.length,
      expiredPrescriptions: expired.length,
      recentPrescriptions,
    };
  },

  async getAppointmentsReport(userId: string): Promise<AppointmentsReport> {
    const [counts, nextAppointment] = await Promise.all([
      ReportsRepository.countAppointmentsByStatus(userId),
      ReportsRepository.findNextAppointment(userId, new Date()),
    ]);

    return {
      totalAppointments: counts.total,
      upcomingAppointments: counts.scheduled,
      completedAppointments: counts.completed,
      cancelledAppointments: counts.cancelled,
      nextAppointment: nextAppointment
        ? {
            id: nextAppointment._id.toString(),
            doctorName: nextAppointment.doctorName,
            purpose: nextAppointment.purpose,
            appointmentDate: nextAppointment.appointmentDate,
            appointmentTime: nextAppointment.appointmentTime,
          }
        : null,
    };
  },

  async getInsights(userId: string): Promise<ReportsInsights> {
    const [trend, bestDay, medicineProgress, allMedicines, appointmentCounts] = await Promise.all([
      MedicineService.getMonthlyAdherenceTrend(userId),
      MedicineService.getBestAdherenceDay(userId),
      MedicineService.getMedicineWiseProgress(userId, 30),
      MedicineService.getMedicinesByUserId(userId),
      ReportsRepository.countAppointmentsByStatus(userId),
    ]);

    const deltaPercent = trend.currentPercent - trend.previousPercent;
    const direction = deltaPercent > 0 ? "up" : deltaPercent < 0 ? "down" : "flat";

    const mostMissed = medicineProgress
      .map((m) => ({ name: m.name, missedCount: m.dosesScheduled - m.dosesTaken }))
      .filter((m) => m.missedCount > 0)
      .sort((a, b) => b.missedCount - a.missedCount)[0];

    const attendanceBase = appointmentCounts.completed + appointmentCounts.cancelled;
    const appointmentAttendanceRate =
      attendanceBase > 0 ? Math.round((appointmentCounts.completed / attendanceBase) * 100) : 0;

    return {
      adherenceTrend: {
        currentPercent: trend.currentPercent,
        previousPercent: trend.previousPercent,
        deltaPercent,
        direction,
      },
      mostMissedMedicine: mostMissed ?? null,
      bestAdherenceDay: bestDay,
      totalMedicinesCompleted: allMedicines.filter((m) => m.status === "completed").length,
      appointmentAttendanceRate,
    };
  },
};
