// Architecture only — no queries or business logic implemented yet.
// Each method below documents which existing domain it will eventually
// aggregate from once implemented.

export interface UserSummary {
  id: string;
  username: string;
  email: string;
  profileImage?: string | null;
}

export interface OverviewStats {
  activeMedicines: number;
  prescriptions: number;
  upcomingAppointments: number;
  activeReminders: number;
}

export type RecentActivityType =
  | "medicine_taken"
  | "prescription_uploaded"
  | "appointment_booked"
  | "reminder_set";

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  timestamp: Date;
}

export interface ProfileChecklistItem {
  label: string;
  completed: boolean;
}

export interface ProfileCompletionSummary {
  percentage: number;
  checklist: ProfileChecklistItem[];
}

export interface HealthTipSummary {
  title: string;
  tip: string;
  category: string;
}

export interface DashboardResponse {
  user: UserSummary;
  overview: OverviewStats;
  recentActivity: RecentActivityItem[];
  profileCompletion: ProfileCompletionSummary;
  healthTip: HealthTipSummary;
}

export const DashboardService = {
  // Source: UserRepository / UserService (same data as GET /api/auth/whoami)
  async getUserSummary(userId: string): Promise<UserSummary> {
    throw new Error("Not implemented");
  },

  // Source: MedicineService.getActiveMedicinesByUserId, a Prescription count,
  // an Appointment count (upcoming only), a Reminder count (active only)
  async getOverviewStats(userId: string): Promise<OverviewStats> {
    throw new Error("Not implemented");
  },

  // Source: merge + sort recent events from medicine logs, prescriptions,
  // appointments, reminders (mirrors TimelineService, but capped/summarized
  // for dashboard display rather than the full timeline view)
  async getRecentActivity(userId: string): Promise<RecentActivityItem[]> {
    throw new Error("Not implemented");
  },

  // Source: UserService — derive checklist completion from profile fields
  // (username, email, phone, bloodGroup, emergencyContact, profileImage)
  async getProfileCompletion(userId: string): Promise<ProfileCompletionSummary> {
    throw new Error("Not implemented");
  },

  // Source: static/curated tip pool for now; could later come from AiService
  // for a personalized, per-user tip
  async getHealthTip(userId: string): Promise<HealthTipSummary> {
    throw new Error("Not implemented");
  },

  // Orchestrates all widget sections in parallel and assembles the response
  // consumed by both the web and future mobile dashboard.
  async getDashboardData(userId: string): Promise<DashboardResponse> {
    const [user, overview, recentActivity, profileCompletion, healthTip] = await Promise.all([
      this.getUserSummary(userId),
      this.getOverviewStats(userId),
      this.getRecentActivity(userId),
      this.getProfileCompletion(userId),
      this.getHealthTip(userId),
    ]);

    return { user, overview, recentActivity, profileCompletion, healthTip };
  },
};
