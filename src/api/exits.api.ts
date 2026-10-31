import { api } from '@/lib/fetchClient';
import type { ExitRequest, ExitDetail, ExitsListResponse, EligibleInvestment, ApiResponse } from '@/types';

export const exitsApi = {
  getEligible: (): Promise<EligibleInvestment[]> =>
    api.get<EligibleInvestment[]>('/exits/eligible'),

  create: (payload: {
    investmentId: string;
    termsAccepted: boolean;
  }): Promise<ApiResponse<ExitRequest>> => api.post<ApiResponse<ExitRequest>>('/exits', payload),

  list: (filter = 'history'): Promise<ExitsListResponse> =>
    api.get<ExitsListResponse>(`/exits/me?filter=${filter}`),

  getById: (exitId: string): Promise<ApiResponse<ExitDetail>> =>
    api.get<ApiResponse<ExitDetail>>(`/exits/${exitId}`),

  // Not in the Postman docs yet (asked the backend); handled like the documented receipts
  getReceipt: (exitId: string): Promise<Blob> => api.getBlob(`/exits/${exitId}/receipt`),

  cancel: (exitId: string): Promise<ApiResponse<null>> =>
    api.delete<ApiResponse<null>>(`/exits/${exitId}`),
};
