import { api } from '@/lib/fetchClient';
import type { KYCStatusResponse, ApiResponse } from '@/types';

export const kycApi = {
  getStatus: (): Promise<ApiResponse<KYCStatusResponse>> =>
    api.get<ApiResponse<KYCStatusResponse>>('/kyc/status'),

  getPrefill: (): Promise<ApiResponse<Record<string, string>>> => api.get('/kyc/prefill'),

  createSession: (): Promise<ApiResponse<{ token: string; sessionId: string }>> =>
    api.post('/kyc/session'),

  verifyNIN: (payload: {
    nin: string;
    firstname: string;
    lastname: string;
  }): Promise<ApiResponse<{ verified: boolean }>> => api.post('/kyc/verify-nin', payload),

  verifyLiveness: (payload: {
    nin: string;
    photoBase64: string;
    firstname: string;
    lastname: string;
  }): Promise<ApiResponse<{ verified: boolean }>> => api.post('/kyc/verify-liveness', payload),

  complete: (payload: { sessionId: string }): Promise<ApiResponse<null>> =>
    api.post('/kyc/complete', payload),

  submit: (): Promise<ApiResponse<null>> => api.post('/kyc/submit'),

  corporateVerifyAccountManager: (payload: {
    nin: string;
    firstname: string;
    lastname: string;
  }): Promise<ApiResponse<{ verified: boolean }>> =>
    api.post('/kyc/corporate/verify-account-manager', payload),

  corporateSubmitCAC: (payload: {
    cacNumber: string;
    cacDocumentUrl: string;
  }): Promise<ApiResponse<null>> => api.post('/kyc/corporate/submit-cac', payload),
};
