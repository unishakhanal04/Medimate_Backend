export type AdminNotificationType =
  | "new_user_registered"
  | "payment_success"
  | "subscription_expired"
  | "gemini_api_failed"
  | "system_error";

export interface AdminNotificationItem {
  id: string;
  type: AdminNotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface AdminNotificationsResult {
  items: AdminNotificationItem[];
  unreadCount: number;
}
