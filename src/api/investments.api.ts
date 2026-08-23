import { api, unwrapEnvelope } from '@/lib/fetchClient';
import type { Investment, PortfolioPerformance, PaginatedResponse, ApiResponse } from '@/types';

export interface InstallmentEntry {
  id: string;
  label?: string;
  description?: string;
  amount: number;
  balanceDue?: number;
  paidAmount?: number;
  status: string;
  paidAt?: string;
  dueDate?: string;
  paymentMethod?: string;
  planType?: string;
  reference?: string;
  type?: string;
}

export const investmentsApi = {
  checkout: (payload: {
    propertyId: string;
    quantity: number;
    transactionPin: string;
  }): Promise<ApiResponse<Investment>> => api.post<ApiResponse<Investment>>('/investments', payload),

  list: async (page = 1, limit = 10, status?: string): Promise<PaginatedResponse<Investment>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status && status !== 'all') params.set('status', status);
    const raw = await api.get<{ data: Investment[]; meta: PaginatedResponse<Investment>['pagination'] }>(`/investments/me?${params}`);
    return { data: raw.data, pagination: raw.meta };
  },

  getPerformance: (period = 'past_6_months'): Promise<PortfolioPerformance> =>
    api.get<PortfolioPerformance>(`/investments/me/performance?period=${period}`),

  getById: (investmentId: string): Promise<Investment> =>
    api.get<unknown>(`/investments/${investmentId}`).then(unwrapEnvelope<Investment>),

  getReceipt: (investmentId: string): Promise<Blob> =>
    api.getBlob(`/investments/${investmentId}/receipt`),

  getCertificate: (investmentId: string): Promise<Blob> =>
    api.getBlob(`/investments/${investmentId}/certificate`),

  getPayments: async (investmentId: string): Promise<InstallmentEntry[]> => {
    const raw = await api.get<unknown>(`/investments/${investmentId}/payments`);
    if (Array.isArray(raw)) return raw as InstallmentEntry[];
    const wrapped = raw as Record<string, unknown>;
    if (Array.isArray(wrapped.data)) return wrapped.data as InstallmentEntry[];
    return [];
  },

  payInstallment: (
    investmentId: string,
    payload: { transactionPin: string }
  ): Promise<ApiResponse<unknown>> => api.post(`/investments/${investmentId}/payments`, payload),
};
