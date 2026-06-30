import { api } from '@/lib/fetchClient';
import type { Property, PaginatedResponse, ApiResponse } from '@/types';

export const favoritesApi = {
  list: (page = 1, limit = 10): Promise<PaginatedResponse<Property>> =>
    api.get<PaginatedResponse<Property>>(`/favorites?page=${page}&limit=${limit}`),

  getIds: (): Promise<ApiResponse<string[]>> => api.get<ApiResponse<string[]>>('/favorites/ids'),

  add: (propertyId: string): Promise<ApiResponse<null>> =>
    api.post<ApiResponse<null>>(`/favorites/${propertyId}`),

  remove: (propertyId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/favorites/${propertyId}`),
};
