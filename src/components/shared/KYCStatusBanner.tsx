import { Link } from 'react-router-dom';
import { RiAlertLine } from 'react-icons/ri';
import type { KYCStatus } from '@/types';
import { Button } from '@/components/ui/button';

interface KYCStatusBannerProps {
  kycStatus: KYCStatus;
  kycPath: string;
}

const MESSAGES: Record<Exclude<KYCStatus, 'approved'>, string> = {
  pending: 'Your KYC is under review. We\'ll notify you once approved.',
  rejected: 'Your KYC was rejected. Please re-submit to unlock payouts.',
  not_submitted: 'Complete KYC verification to unlock withdrawals and payouts.',
};

export function KYCStatusBanner({ kycStatus, kycPath }: KYCStatusBannerProps) {
  if (kycStatus === 'approved') return null;

  const message = MESSAGES[kycStatus] ?? MESSAGES.not_submitted;
  const showCta = kycStatus !== 'pending';
  const ctaLabel = kycStatus === 'rejected' ? 'Re-submit' : 'Complete KYC';

  return (
    <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
      <RiAlertLine className="text-amber-400 h-5 w-5 mt-0.5 shrink-0" />
      <p className="text-amber-400 text-sm font-medium flex-1 min-w-0">{message}</p>
      {showCta && (
        <Link to={kycPath} className="shrink-0">
          <Button size="sm" variant="outline" className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10">
            {ctaLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
