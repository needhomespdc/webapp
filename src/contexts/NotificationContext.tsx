import { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { useAuth } from '@/hooks/useAuth';
import { queryKeys } from '@/lib/queryKeys';
import { createNotificationSocket, type AppSocket } from '@/lib/socket';
import { getAccessToken } from '@/lib/fetchClient';
import { toast } from '@/hooks/useToast';
import type { Notification } from '@/types';
import type {
  NotificationCreatedPayload,
  NotificationReadPayload,
  NotificationsAllReadPayload,
} from '@/types/socket.types';

interface NotificationContextValue {
  unreadCount: number;
  notifications: Notification[];
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<AppSocket | null>(null);

  // Initial REST fetch — no polling; socket delivers live updates
  const { data } = useQuery({
    queryKey: queryKeys.notifications.feed,
    queryFn: () => notificationsApi.list('all', 1, 20).then((r) => r.data),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const notifications = data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Live socket connection — one connection per auth session
  useEffect(() => {
    if (!isAuthenticated) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const socket = createNotificationSocket(token);
    socketRef.current = socket;

    socket.on('notification_created', (payload: NotificationCreatedPayload) => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.feed,
        (prev) => [payload.notification, ...(prev ?? [])]
      );
      // Keep paginated Notifications page in sync
      queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
      toast({ title: payload.notification.title, description: payload.notification.body });
    });

    socket.on('notification_read', (payload: NotificationReadPayload) => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.feed,
        (prev) =>
          prev?.map((n) => (n.id === payload.notificationId ? { ...n, isRead: true } : n)) ?? []
      );
    });

    socket.on('notifications_all_read', (_payload: NotificationsAllReadPayload) => {
      queryClient.setQueryData<Notification[]>(
        queryKeys.notifications.feed,
        (prev) => prev?.map((n) => ({ ...n, isRead: true })) ?? []
      );
    });

    return () => {
      socket.off('notification_created');
      socket.off('notification_read');
      socket.off('notifications_all_read');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]); // intentionally omits accessToken — reconnects only on login/logout

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markRead = useCallback(
    (id: string) => markReadMutation.mutate(id),
    [markReadMutation]
  );

  const markAllRead = useCallback(
    () => markAllReadMutation.mutate(),
    [markAllReadMutation]
  );

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
}
