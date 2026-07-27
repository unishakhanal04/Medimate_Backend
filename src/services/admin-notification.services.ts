import { UserModel } from "../models/user.model";
import { SystemErrorLogModel } from "../models/system-error-log.model";
import { UserRepository } from "../repositories/user.repository";
import { AdminNotificationItem, AdminNotificationsResult } from "../types/admin-notification.type";

const LOOKBACK_DAYS = 14;

export const AdminNotificationService = {
  async getNotifications(adminId: string): Promise<AdminNotificationsResult> {
    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    const [newUsers, geminiFailures, serverErrors, admin] = await Promise.all([
      UserModel.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
      SystemErrorLogModel.find({ source: "gemini_api", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
      SystemErrorLogModel.find({ source: "server", createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(30),
      UserRepository.findById(adminId),
    ]);

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
