import mongoose from "mongoose";
import { AdminRepository } from "../repositories/admin.repository";
import { listUsersForAdmin, getAdminUserById, getUserActivitySummary, updateUserByAdmin } from "./admin.user.services";
import { UserListQuery } from "../types/user.type";
import {
  AdminDashboardSummary,
  AdminFeedbackListQuery,
  AdminFeedbackListResult,
  AdminPaymentListQuery,
  AdminPaymentListResult,
  AdminReportsOverview,
  AdminSubscriptionListQuery,
  AdminSubscriptionListResult,
  AdminSubscriptionStats,
  SystemHealth,
  UserGrowthPoint,
} from "../types/admin.type";
import { FeedbackStatus } from "../models/feedback.model";
import { HttpException } from "../exceptions/http-exception";

const DB_STATE_LABELS: Record<number, SystemHealth["databaseStatus"]> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
};

const REPORT_WEEKS = 8;
const EXPIRY_WINDOW_DAYS = 30;

// null when the previous week had zero baseline — a "% change from 0" isn't a
// meaningful number, so the UI shows a neutral/"new" state instead of a percent.
const deltaPercent = (current: number, previous: number): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return Math.round(((current - previous) / previous) * 100);
};

const bucketByWeek = (dates: Date[], weeks: number): UserGrowthPoint[] => {
  const points: UserGrowthPoint[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const count = dates.filter((date) => date >= weekStart && date <= weekEnd).length;
    points.push({
      label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    });
  }
  return points;
};

export const AdminService = {
  async getDashboardSummary(): Promise<AdminDashboardSummary> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      userStats,
      newUsersThisWeek,
      newUsersLastWeek,
      activeUsersToday,
      medicineStats,
      medicinesAddedThisWeek,
      medicinesAddedLastWeek,
      totalPrescriptions,
      prescriptionsUploadedThisWeek,
      prescriptionsUploadedLastWeek,
      appointmentStats,
      appointmentsCreatedThisWeek,
      appointmentsCreatedLastWeek,
      totalAiConversations,
      adherenceSnapshot,
    ] = await Promise.all([
      AdminRepository.countUsersByStatus(),
      AdminRepository.countNewUsersSince(weekAgo),
      AdminRepository.countUsersCreatedBetween(twoWeeksAgo, weekAgo),
      AdminRepository.countUsersActiveSince(startOfToday),
      AdminRepository.countMedicinesByStatus(),
      AdminRepository.countMedicinesCreatedSince(weekAgo),
      AdminRepository.countMedicinesCreatedBetween(twoWeeksAgo, weekAgo),
      AdminRepository.countPrescriptions(),
      AdminRepository.countPrescriptionsCreatedSince(weekAgo),
      AdminRepository.countPrescriptionsCreatedBetween(twoWeeksAgo, weekAgo),
      AdminRepository.countAppointmentsByStatus(),
      AdminRepository.countAppointmentsCreatedSince(weekAgo),
      AdminRepository.countAppointmentsCreatedBetween(twoWeeksAgo, weekAgo),
      AdminRepository.countAiConversations(),
      AdminRepository.getAdherenceSnapshotSince(weekAgo),
    ]);

    return {
      totalUsers: userStats.total,
      activeUsers: userStats.active,
      inactiveUsers: userStats.inactive,
      adminUsers: userStats.admins,
      newUsersThisWeek,
      activeUsersToday,
      totalMedicines: medicineStats.total,
      activeMedicines: medicineStats.active,
      medicinesAddedThisWeek,
      totalPrescriptions,
      prescriptionsUploadedThisWeek,
      totalAppointments: appointmentStats.total,
      upcomingAppointments: appointmentStats.upcoming,
      appointmentsCreatedThisWeek,
      totalAiConversations,
      averageAdherence:
        adherenceSnapshot.total > 0 ? Math.round((adherenceSnapshot.taken / adherenceSnapshot.total) * 100) : 0,
      newUsersThisWeekDeltaPercent: deltaPercent(newUsersThisWeek, newUsersLastWeek),
      medicinesAddedThisWeekDeltaPercent: deltaPercent(medicinesAddedThisWeek, medicinesAddedLastWeek),
      appointmentsCreatedThisWeekDeltaPercent: deltaPercent(appointmentsCreatedThisWeek, appointmentsCreatedLastWeek),
      prescriptionsUploadedThisWeekDeltaPercent: deltaPercent(prescriptionsUploadedThisWeek, prescriptionsUploadedLastWeek),
    };
  },

  async getReportsOverview(): Promise<AdminReportsOverview> {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - REPORT_WEEKS * 7);

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + EXPIRY_WINDOW_DAYS);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const [
      userCreatedDates,
      medicineTakenDates,
      appointmentCreatedDates,
      prescriptionCreatedDates,
      conversationCreatedDates,
      appointmentStats,
      medicineStats,
      totalPrescriptions,
      prescriptionsExpiringSoon,
      todaysRegistrations,
      weeklyActiveUsers,
      monthlyAiRequests,
    ] = await Promise.all([
      AdminRepository.findUserCreatedDatesSince(since),
      AdminRepository.findMedicineTakenDatesSince(since),
      AdminRepository.findAppointmentCreatedDatesSince(since),
      AdminRepository.findPrescriptionCreatedDatesSince(since),
      AdminRepository.findConversationCreatedDatesSince(since),
      AdminRepository.countAppointmentsByStatus(),
      AdminRepository.countMedicinesByStatus(),
      AdminRepository.countPrescriptions(),
      AdminRepository.countPrescriptionsExpiringSoon(now, soon),
      AdminRepository.countNewUsersSince(startOfToday),
      AdminRepository.countUsersActiveSince(weekAgo),
      AdminRepository.countAiMessagesSince(monthAgo),
    ]);

    return {
      kpis: {
        todaysRegistrations,
        weeklyActiveUsers,
        monthlyAiRequests,
        medicineCompletionRate:
          medicineStats.total > 0 ? Math.round((medicineStats.completed / medicineStats.total) * 100) : 0,
        averageSessionTime: null,
      },
      userGrowth: bucketByWeek(userCreatedDates, REPORT_WEEKS),
      medicineUsageTrend: bucketByWeek(medicineTakenDates, REPORT_WEEKS),
      appointmentTrend: bucketByWeek(appointmentCreatedDates, REPORT_WEEKS),
      prescriptionUploadTrend: bucketByWeek(prescriptionCreatedDates, REPORT_WEEKS),
      aiUsageTrend: bucketByWeek(conversationCreatedDates, REPORT_WEEKS),
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

  async listPayments(query: AdminPaymentListQuery): Promise<AdminPaymentListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));

    const { payments, total } = await AdminRepository.findPayments({ page, limit, status: query.status });

    const userIds = [...new Set(payments.map((p) => p.userId))];
    const users = await AdminRepository.findUsersByIds(userIds);
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return {
      data: payments.map((payment) => {
        const user = userById.get(payment.userId);
        return {
          id: payment._id.toString(),
          transactionUuid: payment.transactionUuid,
          userId: payment.userId,
          username: user?.username ?? null,
          email: user?.email ?? null,
          amount: payment.amount,
          gateway: payment.gateway,
          status: payment.status,
          esewaRefId: payment.esewaRefId,
          createdAt: payment.createdAt,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getSubscriptionStats(): Promise<AdminSubscriptionStats> {
    const now = new Date();
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalSubscriptions, premiumUsers, expiredPlans, successfulPayments, failedPayments, totalRevenue, revenueThisMonth] =
      await Promise.all([
        AdminRepository.countSubscriptions(),
        AdminRepository.countActiveSubscriptions(now),
        AdminRepository.countExpiredSubscriptions(now),
        AdminRepository.countSuccessfulPayments(),
        AdminRepository.countFailedPayments(),
        AdminRepository.sumSuccessfulPaymentsAmount(),
        AdminRepository.sumSuccessfulPaymentsAmount(monthStart),
      ]);

    // Each Subscription doc represents a user's first premium purchase; every
    // successful payment beyond that (verifySubscriptionPayment extends the
    // existing doc's expiresAt rather than creating a new one) is a renewal.
    const renewals = Math.max(successfulPayments - totalSubscriptions, 0);

    return {
      totalSubscriptions,
      premiumUsers,
      expiredPlans,
      renewals,
      failedPayments,
      totalRevenue,
      revenueThisMonth,
    };
  },

  async listSubscriptions(query: AdminSubscriptionListQuery): Promise<AdminSubscriptionListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 10));
    const now = new Date();

    const { subscriptions, total } = await AdminRepository.findSubscriptions({
      page,
      limit,
      status: query.status,
      now,
    });

    const userIds = [...new Set(subscriptions.map((s) => s.userId))];
    const users = await AdminRepository.findUsersByIds(userIds);
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return {
      data: subscriptions.map((sub) => {
        const user = userById.get(sub.userId);
        const effectiveStatus = sub.status === "cancelled" ? "cancelled" : sub.expiresAt < now ? "expired" : "active";
        return {
          id: sub._id.toString(),
          userId: sub.userId,
          username: user?.username ?? null,
          email: user?.email ?? null,
          plan: sub.plan,
          status: effectiveStatus,
          startDate: sub.startDate,
          expiresAt: sub.expiresAt,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async listFeedback(query: AdminFeedbackListQuery): Promise<AdminFeedbackListResult> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 15));

    const { items, total } = await AdminRepository.findFeedback({
      page,
      limit,
      type: query.type,
      status: query.status,
    });

    const userIds = [...new Set(items.map((f) => f.userId))];
    const users = await AdminRepository.findUsersByIds(userIds);
    const userById = new Map(users.map((u) => [u._id.toString(), u]));

    return {
      data: items.map((feedback) => {
        const user = userById.get(feedback.userId);
        return {
          id: feedback._id.toString(),
          userId: feedback.userId,
          username: user?.username ?? null,
          email: user?.email ?? null,
          type: feedback.type,
          subject: feedback.subject,
          message: feedback.message,
          status: feedback.status,
          createdAt: feedback.createdAt,
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async updateFeedbackStatus(id: string, status: FeedbackStatus) {
    const updated = await AdminRepository.updateFeedbackStatus(id, status);
    if (!updated) {
      throw new HttpException(404, "Feedback not found");
    }
    return updated;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    return {
      apiStatus: "ok",
      databaseStatus: DB_STATE_LABELS[mongoose.connection.readyState] ?? "disconnected",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
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

  async getUserActivity(userId: string) {
    return getUserActivitySummary(userId);
  },

  async updateUserStatus(userId: string, status: "active" | "inactive", adminId: string) {
    return updateUserByAdmin(userId, { status }, adminId);
  },
};
