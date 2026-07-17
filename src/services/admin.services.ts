import { AdminRepository } from "../repositories/admin.repository";
import { listUsersForAdmin, getAdminUserById, updateUserByAdmin } from "./admin.user.services";
import { UserListQuery } from "../types/user.type";
import { AdminDashboardSummary, AdminReportsOverview, UserGrowthPoint } from "../types/admin.type";

const REPORT_WEEKS = 8;
const EXPIRY_WINDOW_DAYS = 30;

export const AdminService = {
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [userStats, newUsersThisWeek, medicineStats, totalPrescriptions, appointmentStats, totalAiConversations] =
      await Promise.all([
        AdminRepository.countUsersByStatus(),
        AdminRepository.countNewUsersSince(weekAgo),
        AdminRepository.countMedicinesByStatus(),
        AdminRepository.countPrescriptions(),
        AdminRepository.countAppointmentsByStatus(),
        AdminRepository.countAiConversations(),
      ]);

    return {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      inactiveUsers: userStats.inactive,
      adminUsers: userStats.admins,
      newUsersThisWeek,
      totalMedicines: medicineStats.total,
      activeMedicines: medicineStats.active,
      totalPrescriptions,
      totalAppointments: appointmentStats.total,
      upcomingAppointments: appointmentStats.upcoming,
      totalAiConversations,
    };
  },

  async getReportsOverview(): Promise<AdminReportsOverview> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - REPORT_WEEKS * 7);

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + EXPIRY_WINDOW_DAYS);

    const [createdDates, appointmentStats, medicineStats, totalPrescriptions, prescriptionsExpiringSoon] =
      await Promise.all([
        AdminRepository.findUserCreatedDatesSince(since),
        AdminRepository.countAppointmentsByStatus(),
        AdminRepository.countMedicinesByStatus(),
        AdminRepository.countPrescriptions(),
        AdminRepository.countPrescriptionsExpiringSoon(now, soon),
      ]);

    const userGrowth: UserGrowthPoint[] = [];
    for (let i = REPORT_WEEKS - 1; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const count = createdDates.filter((date) => date >= weekStart && date <= weekEnd).length;
      userGrowth.push({
        label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count,
      });
    }

    return {
      userGrowth,
      appointmentsByStatus: {
        scheduled: appointmentStats.scheduled,
        completed: appointmentStats.completed,
        cancelled: appointmentStats.cancelled,
      },
      medicinesByStatus: {
        active: medicineStats.active,
        inactive: medicineStats.inactive,
        completed: medicineStats.completed,
      },
      totalPrescriptions,
      prescriptionsExpiringSoon,
    };
  },

  // Thin delegates — the real list/detail/update logic (validation, pagination,
  // search) already lives in admin.user.services.ts and backs the existing
  // /api/v1/admin/users CRUD; these just expose it through this module's own
  // sendSuccess-enveloped routes instead of re-implementing it.
  async listUsers(query: Partial<UserListQuery>) {
    return listUsersForAdmin(query);
  },

  async getUserDetails(userId: string) {
    return getAdminUserById(userId);
  },

  async updateUserStatus(userId: string, status: "active" | "inactive") {
    return updateUserByAdmin(userId, { status });
  },
};
