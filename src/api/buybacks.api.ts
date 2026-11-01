import { api } from '@/lib/fetchClient';
import type { ApiResponse, EligibleInvestment } from '@/types';

/**
 * A buy back request as the detail screen needs it. The API docs don't pin the
 * response shape down yet, so every field past id and status is optional.
 */
export interface BuybackDetail {
  id: string;
  status: string;
  statusLabel?: string;
  reference?: string;
  investmentId?: string;
  title?: string;
  propertyTitle?: string;
  propertyImageUrl?: string | null;
  investmentType?: string;
  investmentTypeLabel?: string;
  quantity?: number;
  quantityLabel?: string;
  proposedPrice?: number;
  buybackAmount?: number | null;
  processingFee?: number;
  processingFeeRate?: number;
  netPayout?: number;
  rejectionReason?: string | null;
  listedAt?: string;
  requestedAt?: string;
  createdAt?: string;
}

const unwrap = <T>(raw: unknown): T => {
  const r = raw as Record<string, unknown>;
  return (r && 'data' in r ? r.data : raw) as T;
};

/** Accepts a bare array or a { data: [...] } envelope */
const unwrapList = <T>(raw: unknown): T[] => {
  if (Array.isArray(raw)) return raw as T[];
  const r = raw as Record<string, unknown>;
  return (Array.isArray(r?.data) ? r.data : []) as T[];
};

export const buybacksApi = {
  /** POST /buybacks: the docs list only investmentId; quantity and proposedPrice come from the Oct 2026 design */
  create: (payload: { investmentId: string; quantity: number; proposedPrice: number }) =>
    api.post<ApiResponse<BuybackDetail>>('/buybacks', payload).then((r) => unwrap<BuybackDetail>(r)),

  /** GET /buybacks/eligible: holdings the investor can request a buy back on (same shape as exits/resales) */
  getEligible: () => api.get<unknown>('/buybacks/eligible').then((raw) => unwrapList<EligibleInvestment>(raw)),

  /** GET /buybacks/me: the investor's buy back requests (list shape undocumented; accepts a bare array or { data }) */
  listMine: (filter?: 'pending' | 'history' | 'cancelled') =>
    api.get<unknown>(`/buybacks/me${filter ? `?filter=${filter}` : ''}`).then((raw) => unwrapList<BuybackDetail>(raw)),

  getById: (id: string) => api.get<ApiResponse<BuybackDetail>>(`/buybacks/${id}`).then((r) => unwrap<BuybackDetail>(r)),

  cancel: (id: string) => api.delete<ApiResponse<null>>(`/buybacks/${id}`),
};
