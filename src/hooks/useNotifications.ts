import { useInfiniteQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { queryKeys } from '@/lib/queryKeys';
import { useNotificationContext } from '@/contexts/NotificationContext';

export function useNotifications() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationContext();
  return { notifications, unreadCount, markRead, markAllRead };
}

export function useNotificationsList(status = 'all', limit = 20) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.notifications.list(status),
    queryFn: ({ pageParam }) => notificationsApi.list(status, pageParam, limit),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
  });

  return {
    notifications: query.data?.pages.flatMap((p) => p.data) ?? [],
    isLoading: query.isLoading,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  };
}
