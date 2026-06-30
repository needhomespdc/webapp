import { api } from '@/lib/fetchClient';
import type { Notification, PaginatedResponse, ApiResponse } from '@/types';

export const notificationsApi = {
  list: (status = 'all', page = 1, limit = 20): Promise<PaginatedResponse<Notification>> =>
    api.get<PaginatedResponse<Notification>>(
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
