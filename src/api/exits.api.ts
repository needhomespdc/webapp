import { api } from '@/lib/fetchClient';
import type { ExitRequest, Investment, PaginatedResponse, ApiResponse } from '@/types';

export const exitsApi = {
  getEligible: (): Promise<ApiResponse<Investment[]>> =>
    api.get<ApiResponse<Investment[]>>('/exits/eligible'),

  create: (payload: {
    investmentId: string;
    termsAccepted: boolean;
  }): Promise<ApiResponse<ExitRequest>> => api.post<ApiResponse<ExitRequest>>('/exits', payload),

  list: (filter = 'history'): Promise<PaginatedResponse<ExitRequest>> =>
    api.get<PaginatedResponse<ExitRequest>>(`/exits/me?filter=${filter}`),

  getById: (exitId: string): Promise<ApiResponse<ExitRequest>> =>
    api.get<ApiResponse<ExitRequest>>(`/exits/${exitId}`),

  cancel: (exitId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/exits/${exitId}`),
};
