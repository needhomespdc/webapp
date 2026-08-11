import type { Notification } from '@/types';
import type { SupportMessage } from '@/api/support.api';

export interface NotificationCreatedPayload {
  type: 'notification_created';
  notification: Notification;
  unreadCount: number;
}

export interface NotificationReadPayload {
  type: 'notification_read';
  notificationId: string;
  unreadCount: number;
}

export interface NotificationsAllReadPayload {
  type: 'notifications_all_read';
  unreadCount: number;
  updatedCount: number;
}

export interface SupportMessagePayload {
  type: 'support_message';
  message: SupportMessage;
}

export interface SocketServerEvents {
  notification_created: (payload: NotificationCreatedPayload) => void;
  notification_read: (payload: NotificationReadPayload) => void;
  notifications_all_read: (payload: NotificationsAllReadPayload) => void;
  support_message: (payload: SupportMessagePayload) => void;
}

export interface SocketClientEvents {
  join_ticket: (ticketId: string) => void;
  leave_ticket: (ticketId: string) => void;
}
