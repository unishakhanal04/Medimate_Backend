import { AdherenceSeriesPoint, RefillAlert, MedicineProgress } from "./medicine.type";

export interface ReportsOverview {
  totalMedicines: number;
  activeMedicines: number;
  totalPrescriptions: number;
  activePrescriptions: number;
  upcomingAppointments: number;
  weeklyAdherence: number;
  currentStreak: number;
  memberSince?: Date;
}

export interface AdherenceReport {
  weeklyAdherence: number;
  medicinesTaken: number;
  totalScheduled: number;
  streak: number;
  series: AdherenceSeriesPoint[];
}

export interface MedicinesReport {
  totalMedicines: number;
  activeMedicines: number;
  inactiveMedicines: number;
  completedMedicines: number;
  refillAlerts: RefillAlert[];
  medicineProgress: MedicineProgress[];
}

export interface RecentPrescription {
  id: string;
  title: string;
  doctorName: string;
  prescriptionDate: Date;
  status: "active" | "expired";
}

export interface PrescriptionsReport {
  totalPrescriptions: number;
  activePrescriptions: number;
  expiredPrescriptions: number;
  recentPrescriptions: RecentPrescription[];
}

export interface NextAppointment {
  id: string;
  doctorName: string;
  purpose: string;
  appointmentDate: Date;
  appointmentTime: string;
}

export interface AppointmentsReport {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  nextAppointment: NextAppointment | null;
}

export interface ReportsInsights {
  adherenceTrend: {
    currentPercent: number;
    previousPercent: number;
    deltaPercent: number;
    direction: "up" | "down" | "flat";
  };
  mostMissedMedicine: { name: string; missedCount: number } | null;
  bestAdherenceDay: { day: string; percentage: number } | null;
  totalMedicinesCompleted: number;
  appointmentAttendanceRate: number;
}
