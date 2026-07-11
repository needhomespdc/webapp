import { api } from '@/lib/fetchClient';
import type { Property, PaginatedResponse, ApiResponse } from '@/types';

export const favoritesApi = {
  list: async (page = 1, limit = 10): Promise<PaginatedResponse<Property>> => {
    const raw = await api.get<{ data: Property[]; meta: PaginatedResponse<Property>['pagination'] }>(
      `/favorites?page=${page}&limit=${limit}`
    );
    return { data: raw.data, pagination: raw.meta };
  },

  getIds: (): Promise<{ propertyIds: string[] }> =>
    api.get<{ propertyIds: string[] }>('/favorites/ids'),

  add: (propertyId: string): Promise<ApiResponse<null>> =>
    api.post<ApiResponse<null>>(`/favorites/${propertyId}`),

  remove: (propertyId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/favorites/${propertyId}`),
};
