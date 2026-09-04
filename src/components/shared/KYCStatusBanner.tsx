import { Link } from 'react-router-dom';
import { RiArrowRightLine, RiShieldCheckLine } from 'react-icons/ri';
import type { KYCStatus } from '@/types';

interface KYCStatusBannerProps {
  kycStatus: KYCStatus;
  kycPath: string;
}

const CONTENT: Record<Exclude<KYCStatus, 'approved'>, { title: string; subtitle: string }> = {
  not_submitted: {
    title: 'Complete your KYC',
    subtitle: 'Verify identity to unlock payouts · Not Submitted',
  },
  pending: {
    title: 'KYC Under Review',
    subtitle: 'Your verification is being reviewed · Pending',
  },
  rejected: {
    title: 'KYC Verification Failed',
    subtitle: 'Re-submit your documents to unlock payouts · Rejected',
  },
};

export function KYCStatusBanner({ kycStatus, kycPath }: KYCStatusBannerProps) {
  if (kycStatus === 'approved') return null;

  const { title, subtitle } = CONTENT[kycStatus] ?? CONTENT.not_submitted;

  return (
    <Link
      to={kycPath}
      className="flex items-center gap-3 bg-accent/10 border border-accent/20 rounded-2xl px-4 py-3.5 hover:bg-accent/15 transition-colors group"
    >
      <div className="w-9 h-9 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
        <RiShieldCheckLine className="h-5 w-5 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground text-sm font-semibold leading-tight">{title}</p>
        <p className="text-foreground/50 text-xs mt-0.5 leading-snug">{subtitle}</p>
      </div>
      <RiArrowRightLine className="h-5 w-5 text-accent shrink-0 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
