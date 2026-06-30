import { api } from '@/lib/fetchClient';
import type {
  Property,
  CommissionWallet,
  CommissionEntry,
  ReferralAnalytics,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const partnersApi = {
  getPromotableProperties: (page = 1, limit = 10): Promise<PaginatedResponse<Property>> =>
    api.get<PaginatedResponse<Property>>(
      `/partners/me/promotable-properties?page=${page}&limit=${limit}`
    ),

  getReferralAnalytics: (period = '30d'): Promise<ApiResponse<ReferralAnalytics>> =>
    api.get<ApiResponse<ReferralAnalytics>>(`/partners/me/referral-analytics?period=${period}`),

  getCommissionWallet: (): Promise<ApiResponse<CommissionWallet>> =>
    api.get<ApiResponse<CommissionWallet>>('/partners/me/commission-wallet'),

  getCommissionEntries: (page = 1, limit = 10): Promise<PaginatedResponse<CommissionEntry>> =>
    api.get<PaginatedResponse<CommissionEntry>>(
      `/partners/me/commission-entries?page=${page}&limit=${limit}`
    ),

  getCommissionEntry: (commissionEntryId: string): Promise<ApiResponse<CommissionEntry>> =>
    api.get<ApiResponse<CommissionEntry>>(`/partners/me/commission-entries/${commissionEntryId}`),

  requestPayout: (payload: {
    amount: number;
    bankAccountId: string;
    transactionPin: string;
  }): Promise<ApiResponse<null>> => api.post('/partners/me/commission-wallet/payout', payload),

  trackReferralEvent: (payload: {
    referralCode: string;
    eventType: string;
    propertySlug?: string;
    propertyTitle?: string;
    channel?: string;
  }): Promise<void> => api.post('/partner-referrals/events', payload),
};
