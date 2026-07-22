import { UserModel } from "../models/user.model";
import { PaymentModel } from "../models/payment.model";
import { SubscriptionModel } from "../models/subscription.model";
import { SystemErrorLogModel } from "../models/system-error-log.model";
import { UserRepository } from "../repositories/user.repository";
import { AdminNotificationItem, AdminNotificationsResult } from "../types/admin-notification.type";

const LOOKBACK_DAYS = 14;

export const AdminNotificationService = {
  async getNotifications(adminId: string): Promise<AdminNotificationsResult> {
    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);
    const now = new Date();

    const [newUsers, successfulPayments, expiredSubscriptions, geminiFailures, serverErrors, admin] =
      await Promise.all([
        UserModel.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
        PaymentModel.find({ status: "success", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
        SubscriptionModel.find({ status: "active", expiresAt: { $gte: since, $lt: now } })
          .sort({ expiresAt: -1 })
          .limit(30),
        SystemErrorLogModel.find({ source: "gemini_api", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
        SystemErrorLogModel.find({ source: "server", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
        UserRepository.findById(adminId),
      ]);

    const userIds = [
      ...new Set([...successfulPayments.map((p) => p.userId), ...expiredSubscriptions.map((s) => s.userId)]),
    ];
    const users = await UserModel.find({ _id: { $in: userIds } }).select("username");
    const usernameById = new Map(users.map((u) => [u._id.toString(), u.username]));

    const lastSeen = admin?.notificationsLastSeenAt ?? null;
    const isUnread = (date: Date) => !lastSeen || date > lastSeen;

    const items: AdminNotificationItem[] = [];

    for (const user of newUsers) {
      const createdAt = user.createdAt ?? new Date();
      items.push({
        id: `new-user-${user._id.toString()}`,
        type: "new_user_registered",
        title: "New user registered",
        message: user.username,
        date: createdAt.toISOString(),
        read: !isUnread(createdAt),
      });
    }

    for (const payment of successfulPayments) {
      const username = usernameById.get(payment.userId) ?? "Unknown user";
      items.push({
        id: `payment-${payment._id.toString()}`,
        type: "payment_success",
        title: "Payment success",
        message: `NPR ${payment.amount} from ${username}`,
        date: payment.createdAt.toISOString(),
        read: !isUnread(payment.createdAt),
      });
    }

    for (const sub of expiredSubscriptions) {
      const username = usernameById.get(sub.userId) ?? "Unknown user";
      items.push({
        id: `sub-expired-${sub._id.toString()}`,
        type: "subscription_expired",
        title: "Subscription expired",
        message: username,
        date: sub.expiresAt.toISOString(),
        read: !isUnread(sub.expiresAt),
      });
    }

    for (const failure of geminiFailures) {
      items.push({
        id: `gemini-${failure._id.toString()}`,
        type: "gemini_api_failed",
        title: "Gemini API failed",
        message: failure.message,
        date: failure.createdAt.toISOString(),
        read: !isUnread(failure.createdAt),
      });
    }

    for (const error of serverErrors) {
      items.push({
        id: `error-${error._id.toString()}`,
        type: "system_error",
        title: "System error",
        message: error.message,
        date: error.createdAt.toISOString(),
        read: !isUnread(error.createdAt),
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      items,
      unreadCount: items.filter((item) => !item.read).length,
    };
  },

  async markAllSeen(adminId: string): Promise<{ notificationsLastSeenAt: string }> {
    const now = new Date();
    await UserRepository.update(adminId, { notificationsLastSeenAt: now });
    return { notificationsLastSeenAt: now.toISOString() };
  },
};
