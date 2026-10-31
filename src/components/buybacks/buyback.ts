import type { BuybackDetail } from '@/api/buybacks.api';

export const BUYBACK_FEE_RATE = 0.015;

export type StatusKey = 'pending' | 'approved' | 'rejected' | 'cancelled';

const ALIASES: Record<string, StatusKey> = {
  pending: 'pending',
  under_review: 'pending',
  in_review: 'pending',
  approved: 'approved',
  accepted: 'approved',
  completed: 'approved',
  paid: 'approved',
  rejected: 'rejected',
  declined: 'rejected',
  cancelled: 'cancelled',
  canceled: 'cancelled',
};

export function buybackStatusKey(raw: string | undefined): StatusKey | undefined {
  return ALIASES[(raw ?? '').toLowerCase().replace(/[\s-]+/g, '_')];
}

/** Fee and payout, preferring the API's figures and falling back to the 1.5% rate on the price */
export function buybackAmounts(b: BuybackDetail) {
  const price = b.buybackAmount ?? b.proposedPrice ?? 0;
  const fee = b.processingFee ?? price * (b.processingFeeRate ?? BUYBACK_FEE_RATE);
  return { price, fee, feeRate: b.processingFeeRate ?? BUYBACK_FEE_RATE, net: b.netPayout ?? Math.max(0, price - fee) };
}
