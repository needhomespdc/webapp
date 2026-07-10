import { api } from '@/lib/fetchClient';
import type { Investment, PortfolioPerformance, PaginatedResponse, ApiResponse } from '@/types';

export const investmentsApi = {
  checkout: (payload: {
    propertyId: string;
    quantity: number;
    transactionPin: string;
  }): Promise<ApiResponse<Investment>> => api.post<ApiResponse<Investment>>('/investments', payload),

  list: (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Investment>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.set('status', status);
    return api.get<PaginatedResponse<Investment>>(`/investments/me?${params}`);
  },

  getPerformance: (period = 'past_6_months'): Promise<PortfolioPerformance> =>
    api.get<PortfolioPerformance>(`/investments/me/performance?period=${period}`),

  getById: (investmentId: string): Promise<ApiResponse<Investment>> =>
    api.get<ApiResponse<Investment>>(`/investments/${investmentId}`),

  getReceipt: (investmentId: string): Promise<Blob> =>
    api.getBlob(`/investments/${investmentId}/receipt`),

  getCertificate: (investmentId: string): Promise<Blob> =>
    api.getBlob(`/investments/${investmentId}/certificate`),

  getPayments: (investmentId: string): Promise<ApiResponse<unknown[]>> =>
    api.get(`/investments/${investmentId}/payments`),

  payInstallment: (
    investmentId: string,
    payload: { transactionPin: string }
  ): Promise<ApiResponse<unknown>> => api.post(`/investments/${investmentId}/payments`, payload),
};
