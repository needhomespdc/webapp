import { api } from '@/lib/fetchClient';
import type { ExitRequest, ExitsListResponse, EligibleInvestment, ApiResponse } from '@/types';

export const exitsApi = {
  getEligible: (): Promise<EligibleInvestment[]> =>
    api.get<EligibleInvestment[]>('/exits/eligible'),

  create: (payload: {
    investmentId: string;
    termsAccepted: boolean;
  }): Promise<ApiResponse<ExitRequest>> => api.post<ApiResponse<ExitRequest>>('/exits', payload),

  list: (filter = 'history'): Promise<ExitsListResponse> =>
    api.get<ExitsListResponse>(`/exits/me?filter=${filter}`),

  getById: (exitId: string): Promise<ApiResponse<ExitRequest>> =>
    api.get<ApiResponse<ExitRequest>>(`/exits/${exitId}`),

  cancel: (exitId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/exits/${exitId}`),
};
