export type NotificationType =
  | "medicine_missed"
  | "appointment_tomorrow"
  | "prescription_uploaded"
  | "low_stock"
  | "password_changed";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  refId?: string;
}

export interface NotificationsResult {
  items: NotificationItem[];
  unreadCount: number;
}
