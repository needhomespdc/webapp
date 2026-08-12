import { api } from '@/lib/fetchClient';
import type { Notification, ApiResponse } from '@/types';

export interface NotificationsResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export const notificationsApi = {
  list: (status = 'all', page = 1, limit = 20): Promise<NotificationsResponse> =>
    api.get<NotificationsResponse>(
      `/notifications?status=${status}&page=${page}&limit=${limit}`
    ),

  markRead: (notificationId: string): Promise<ApiResponse<null>> =>
    api.patch<ApiResponse<null>>(`/notifications/${notificationId}/read`),

  markAllRead: (): Promise<ApiResponse<null>> => api.post<ApiResponse<null>>('/notifications/read-all'),

  getPreferences: (): Promise<ApiResponse<Record<string, boolean>>> =>
    api.get('/notifications/preferences'),

  updatePreferences: (preferences: Record<string, boolean>): Promise<ApiResponse<null>> =>
    api.patch('/notifications/preferences', { preferences }),
};
