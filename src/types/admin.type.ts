import { PublicUser, UserListResult } from "./user.type";
import { TimelineEvent } from "./timeline.type";

export interface AdminDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  newUsersThisWeek: number;
  activeUsersToday: number;
  totalMedicines: number;
  activeMedicines: number;
  medicinesAddedThisWeek: number;
  totalPrescriptions: number;
  prescriptionsUploadedThisWeek: number;
  totalAppointments: number;
  upcomingAppointments: number;
  appointmentsCreatedThisWeek: number;
  totalAiConversations: number;
  averageAdherence: number;
  newUsersThisWeekDeltaPercent: number | null;
  medicinesAddedThisWeekDeltaPercent: number | null;
  appointmentsCreatedThisWeekDeltaPercent: number | null;
  prescriptionsUploadedThisWeekDeltaPercent: number | null;
}

export interface UserGrowthPoint {
  label: string;
  count: number;
}

export interface AdminReportsKpis {
  todaysRegistrations: number;
  weeklyActiveUsers: number;
  monthlyAiRequests: number;
  medicineCompletionRate: number;
  averageSessionTime: null;
}

export interface AdminReportsOverview {
  kpis: AdminReportsKpis;
  userGrowth: UserGrowthPoint[];
  medicineUsageTrend: UserGrowthPoint[];
  appointmentTrend: UserGrowthPoint[];
  prescriptionUploadTrend: UserGrowthPoint[];
  aiUsageTrend: UserGrowthPoint[];
  appointmentsByStatus: {
    scheduled: number;
    completed: number;
    cancelled: number;
  };
  medicinesByStatus: {
    active: number;
    inactive: number;
    completed: number;
  };
  totalPrescriptions: number;
  prescriptionsExpiringSoon: number;
}

export interface UpdateUserStatusDTO {
  status: "active" | "inactive";
}

export interface AdminUserActivity {
  user: {
    id: string;
    username: string;
    email: string;
    gender: string;
    role: string;
    status: string;
    profileImage?: string | null;
    createdAt?: Date;
    lastLoginAt?: Date;
  };
  profile: {
    phone?: string;
    dateOfBirth?: Date;
    bloodGroup?: string;
    height?: number;
    weight?: number;
    allergies: string[];
    chronicDiseases: string[];
  };
  medicines: {
    total: number;
    active: number;
    recent: { id: string; name: string; dosage: string; status: string }[];
  };
  appointments: {
    total: number;
    upcoming: number;
    recent: { id: string; doctorName: string; purpose: string; appointmentDate: Date; status: string }[];
  };
  prescriptions: {
    total: number;
    active: number;
    recent: { id: string; title: string; doctorName: string; prescriptionDate: Date }[];
  };
  emergencyContacts: {
    total: number;
    contacts: { id: string; name: string; relationship: string; phone: string; isPrimary: boolean }[];
  };
  timeline: {
    items: TimelineEvent[];
  };
  reports: {
    weeklyAdherence: number;
    streak: number;
    medicinesTaken: number;
    totalScheduled: number;
  };
  aiUsage: {
    totalConversations: number;
  };
}

export interface AdminFeedbackItem {
  id: string;
  userId: string;
  username: string | null;
  email: string | null;
  type: string;
  subject: string;
  message: string;
  status: string;
  createdAt: Date;
}

export interface AdminFeedbackListResult {
  data: AdminFeedbackItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminFeedbackListQuery {
  page: number;
  limit: number;
  type?: "bug_report" | "suggestion" | "feature_request" | "general";
  status?: "new" | "reviewed" | "resolved";
}

export interface SystemHealth {
  apiStatus: "ok";
  databaseStatus: "connected" | "disconnected" | "connecting" | "disconnecting";
  uptimeSeconds: number;
  timestamp: string;
}

export type { PublicUser, UserListResult };
