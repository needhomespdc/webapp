import { api } from '@/lib/fetchClient';
import type { ApiResponse, KYCStatusResponse } from '@/types';

/** Response of the corporate QoreID checks: a failed match is a 200 with `verified: false`. */
export interface CorporateVerificationResult {
  verified: boolean;
  message?: string;
  mismatchedFields?: { field: string; label: string; message: string; source?: string }[];
}

export const kycApi = {
  getStatus: (): Promise<KYCStatusResponse> =>
    api.get<KYCStatusResponse>('/kyc/status'),

  // A mismatch comes back as 200 with verified: false (same shape as the corporate checks)
  verifyNIN: (payload: {
    nin: string;
    firstname: string;
    lastname: string;
    phone?: string;
    dob?: string;
  }): Promise<CorporateVerificationResult> => api.post('/kyc/verify-nin', payload),

  verifyLiveness: (payload: {
    nin: string;
    photoBase64: string;
    firstname: string;
    lastname: string;
  }): Promise<ApiResponse<{ verified: boolean }>> => api.post('/kyc/verify-liveness', payload),

  submit: (): Promise<ApiResponse<null>> => api.post('/kyc/submit'),

  // Corporate KYB step 1: QoreID CAC Basic check on the registration number.
  // A mismatch comes back as 200 with verified: false (see CorporateVerificationResult).
  corporateVerifyCAC: (payload: { cacNumber: string }): Promise<CorporateVerificationResult> =>
    api.post('/kyc/corporate/verify-cac', payload),

  // Corporate KYB step 2 (requires a verified CAC): the account manager's NIN.
  corporateVerifyAccountManager: (payload: {
    nin: string;
    firstname: string;
    lastname: string;
    phone?: string;
    dob?: string;
  }): Promise<CorporateVerificationResult> =>
    api.post('/kyc/corporate/verify-account-manager', payload),

  corporateSubmitCAC: (payload: {
    cacNumber: string;
    cacDocumentUrl: string;
  }): Promise<ApiResponse<null>> => api.post('/kyc/corporate/submit-cac', payload),
};
