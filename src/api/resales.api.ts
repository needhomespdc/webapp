import { api } from '@/lib/fetchClient';
import type { ResaleListing, ResaleDetail, ResalesListResponse, EligibleInvestment, ApiResponse } from '@/types';

export const resalesApi = {
  getEligible: (): Promise<EligibleInvestment[]> =>
    api.get<EligibleInvestment[]>('/resales/eligible'),

  create: (payload: {
    investmentId: string;
    quantity: number;
    minPricePerUnit: number;
    maxPricePerUnit: number;
    termsAccepted: boolean;
  }): Promise<ApiResponse<ResaleListing>> => api.post<ApiResponse<ResaleListing>>('/resales', payload),

  listMine: (): Promise<ResalesListResponse> =>
    api.get<ResalesListResponse>('/resales/me'),

  getById: (resaleListingId: string): Promise<ApiResponse<ResaleDetail>> =>
    api.get<ApiResponse<ResaleDetail>>(`/resales/me/${resaleListingId}`),

  cancel: (resaleListingId: string): Promise<ApiResponse<null>> =>
    api.patch<ApiResponse<null>>(`/resales/${resaleListingId}`),

  delete: (resaleListingId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/resales/${resaleListingId}`),
};
