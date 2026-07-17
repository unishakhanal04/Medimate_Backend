import { PublicUser, UserListResult } from "./user.type";

export interface AdminDashboardSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminUsers: number;
  newUsersThisWeek: number;
  totalMedicines: number;
  activeMedicines: number;
  totalPrescriptions: number;
  totalAppointments: number;
  upcomingAppointments: number;
  totalAiConversations: number;
}

export interface UserGrowthPoint {
  label: string;
  count: number;
}

export interface AdminReportsOverview {
  userGrowth: UserGrowthPoint[];
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

export type { PublicUser, UserListResult };
