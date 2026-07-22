export interface IMedicine {
  _id: string;
  userId: string;
  name: string;
  dosage: string;
  frequency: "daily" | "weekly" | "as_needed";
  times: string[]; // Array of times in "HH:MM" format
  startDate: Date;
  endDate?: Date;
  notes?: string;
  status: "active" | "inactive" | "completed";
  quantity?: number;
  refillThreshold?: number;
  expiryDate?: Date;
  mealInstruction?: "before_food" | "after_food" | "empty_stomach";
  createdAt: Date;
  updatedAt: Date;
}

export interface IMedicineLog {
  _id: string;
  medicineId: string;
  userId: string;
  takenAt: Date;
  scheduledTime: string;
  status: "taken" | "skipped" | "missed";
  createdAt: Date;
}

export interface CreateMedicineDTO {
  name: string;
  dosage: string;
  frequency: "daily" | "weekly" | "as_needed";
  times: string[];
  startDate: string;
  endDate?: string;
  notes?: string;
  quantity?: number;
  refillThreshold?: number;
  expiryDate?: string;
  mealInstruction?: "before_food" | "after_food" | "empty_stomach";
}

export interface UpdateMedicineDTO {
  name?: string;
  dosage?: string;
  frequency?: "daily" | "weekly" | "as_needed";
  times?: string[];
  startDate?: string;
  endDate?: string;
  notes?: string;
  status?: "active" | "inactive" | "completed";
  quantity?: number;
  refillThreshold?: number;
  expiryDate?: string;
  mealInstruction?: "before_food" | "after_food" | "empty_stomach";
}

export interface TodayMedicine {
  _id: string;
  name: string;
  dosage: string;
  time: string;
  status: "taken" | "pending" | "skipped" | "missed";
  logId?: string;
}

export interface AdherenceStats {
  weeklyAdherence: number;
  medicinesTaken: number;
  totalScheduled: number;
  streak: number;
}

export interface AdherenceSeriesPoint {
  label: string;
  scheduled: number;
  taken: number;
  missed: number;
  percentage: number;
}

export interface RefillAlert {
  _id: string;
  name: string;
  dosage: string;
  quantity: number;
  refillThreshold: number;
}

export interface MedicineProgress {
  medicineId: string;
  name: string;
  adherencePercentage: number;
  dosesTaken: number;
  dosesScheduled: number;
}
