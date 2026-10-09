// Kept apart from the provider component so React Fast Refresh can hot-reload the provider
// file (a file that exports both components and other values forces a full reload).
import { createContext, useContext } from 'react';
import type { Notification } from '@/types';

export interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
}

export const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
