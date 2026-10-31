import { unwrapEnvelope } from '@/lib/fetchClient';
import type { CorporateVerificationResult } from '@/api/kyc.api';

export type MismatchedField = NonNullable<CorporateVerificationResult['mismatchedFields']>[number];

/**
 * The QoreID checks (verify-nin, corporate verify-cac / verify-account-manager) report a failed
 * match as 200 { verified: false, message, mismatchedFields }, so callers must read `verified`
 * rather than treating any 200 as a pass. Handles both enveloped and flat responses.
 */
export function readVerification(res: unknown): CorporateVerificationResult {
  return unwrapEnvelope<CorporateVerificationResult>(res) ?? { verified: false };
}
