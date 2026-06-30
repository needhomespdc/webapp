import { api } from '@/lib/fetchClient';
import type { ResaleListing, Investment, PaginatedResponse, ApiResponse } from '@/types';

export const resalesApi = {
  getPublicList: (page = 1, limit = 10): Promise<PaginatedResponse<ResaleListing>> =>
    api.get<PaginatedResponse<ResaleListing>>(`/resales?page=${page}&limit=${limit}`),

  getPublicById: (resaleListingId: string): Promise<ApiResponse<ResaleListing>> =>
    api.get<ApiResponse<ResaleListing>>(`/resales/${resaleListingId}`),

  getEligible: (): Promise<ApiResponse<Investment[]>> =>
    api.get<ApiResponse<Investment[]>>('/resales/eligible'),

  create: (payload: {
    investmentId: string;
    quantity: number;
    minPricePerUnit: number;
    maxPricePerUnit: number;
    termsAccepted: boolean;
  }): Promise<ApiResponse<ResaleListing>> => api.post<ApiResponse<ResaleListing>>('/resales', payload),

  listMine: (): Promise<ApiResponse<ResaleListing[]>> =>
    api.get<ApiResponse<ResaleListing[]>>('/resales/me'),

  getMine: (resaleListingId: string): Promise<ApiResponse<ResaleListing>> =>
    api.get<ApiResponse<ResaleListing>>(`/resales/me/${resaleListingId}`),

  cancel: (resaleListingId: string): Promise<ApiResponse<null>> =>
    api.patch<ApiResponse<null>>(`/resales/${resaleListingId}`),

  delete: (resaleListingId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/resales/${resaleListingId}`),
};
