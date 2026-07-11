import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import { RiDownload2Line, RiArrowRightLine } from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { investmentsApi } from '@/api/investments.api';
import { toast } from '@/hooks/useToast';
import type { Investment } from '@/types';

const MODEL_BADGE_COLORS: Record<string, string> = {
  fractional: 'bg-violet-500',
  outright: 'bg-amber-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  co_development: 'bg-emerald-500',
};

interface InvestmentSuccessModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  investment: Investment;
}

export function InvestmentSuccessModal({
  open,
  onOpenChange,
  investment,
}: InvestmentSuccessModalProps) {
  const navigate = useNavigate();
  const [confettiData, setConfettiData] = useState<object | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && !confettiData) {
      fetch('/lottie-gif/success-confetti.json')
        .then((r) => r.json())
        .then(setConfettiData)
        .catch(() => null);
    }
  }, [open, confettiData]);

  const handleViewInvestment = () => {
    onOpenChange(false);
    navigate(`/investor/portfolio/${investment.id}`);
  };

  const handleGoHome = () => {
    onOpenChange(false);
    navigate('/investor/dashboard');
  };

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      const blob = await investmentsApi.getReceipt(investment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${investment.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Receipt not available yet. Check your portfolio shortly.');
    } finally {
      setDownloading(false);
    }
  };

  const summaryRows = [
    { label: 'Property', value: investment.title },
    { label: 'Location', value: investment.location },
    { label: 'Investment Type', value: investment.typeLabel },
    { label: 'Units / Slots', value: investment.unitsOwnedLabel },
    { label: 'Current Value', value: formatCurrency(investment.currentValue) },
    { label: 'Reference', value: investment.reference, mono: true },
    { label: 'Status', value: investment.statusLabel },
    {
      label: 'Date',
      value: formatDate(investment.startedAt ?? investment.createdAt),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-md rounded-2xl overflow-hidden gap-0 max-h-[95vh] flex flex-col">
        <DialogTitle className="sr-only">Investment Successful</DialogTitle>
        <DialogDescription className="sr-only">
          Your investment in {investment.title} was successful.
        </DialogDescription>

        {/* Hero — primary bg with confetti overlay */}
        <div className="relative bg-primary overflow-hidden shrink-0">
          {confettiData && (
            <div className="absolute inset-0 pointer-events-none z-0">
              <Lottie animationData={confettiData} loop={false} className="w-full h-full" />
            </div>
          )}
          <div className="relative z-10 px-6 pt-10 pb-7 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg
                className="w-7 h-7 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl">Investment Successful!</h2>
            <p className="text-white/65 text-sm mt-1 leading-snug">
              You have successfully invested in {investment.title}.
            </p>
          </div>
        </div>

        {/* Amount + type badge */}
        <div className="px-5 py-4 border-b border-foreground/10 flex items-center justify-between shrink-0">
          <div>
            <p className="text-foreground/50 text-xs mb-0.5">Amount Invested</p>
            <p className="text-foreground font-bold text-2xl">
              {formatCurrency(investment.totalInvested)}
            </p>
          </div>
          <span
            className={cn(
              'text-white text-xs font-semibold px-3 py-1.5 rounded-full',
              MODEL_BADGE_COLORS[investment.type] ?? 'bg-accent'
            )}
          >
            {investment.typeLabel}
          </span>
        </div>

        {/* Investment summary */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 py-3 border-b border-foreground/10">
            <p className="text-foreground font-semibold text-sm">Investment Summary</p>
          </div>

          {summaryRows.map((row, i) => (
            <div
              key={row.label}
              className={cn(
                'flex items-start justify-between px-5 py-3 text-sm gap-3',
                i < summaryRows.length - 1 && 'border-b border-foreground/10'
              )}
            >
              <span className="text-foreground/50 shrink-0">{row.label}</span>
              <span
                className={cn(
                  'text-foreground font-medium text-right break-all',
                  row.mono && 'font-mono text-xs text-foreground/70'
                )}
              >
                {row.value}
              </span>
            </div>
          ))}

          {/* Receipt note */}
          <div className="mx-5 my-4 bg-foreground/5 rounded-xl p-3 flex items-start gap-2.5">
            <span className="text-base shrink-0 mt-0.5">🧾</span>
            <p className="text-foreground/50 text-xs leading-relaxed">
              Your investment receipt will be available shortly in your portfolio.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 pt-3 border-t border-foreground/10 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <Button
              className="flex-1 h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
              onClick={handleViewInvestment}
            >
              View Investment
              <RiArrowRightLine className="h-4 w-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-foreground/20 shrink-0"
              onClick={handleDownloadReceipt}
              disabled={downloading}
              title="Download receipt"
            >
              <RiDownload2Line className="h-5 w-5" />
            </Button>
          </div>
          <button
            onClick={handleGoHome}
            className="w-full text-center text-foreground/40 text-sm hover:text-foreground transition-colors py-1.5"
          >
            Back to Home
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
