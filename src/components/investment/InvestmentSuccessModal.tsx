import { useNavigate } from 'react-router-dom';
import Lottie from 'lottie-react';
import confettiAnimation from '@/assets/lottie/success-confetti.json';
import { RiArrowRightLine, RiFileTextLine } from 'react-icons/ri';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
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
  const isMobile = useMediaQuery('(max-width: 639px)');

  const handleViewInvestment = () => {
    onOpenChange(false);
    navigate(`/investor/portfolio/${investment.id}`);
  };

  const handleGoHome = () => {
    onOpenChange(false);
    navigate('/investor/dashboard');
  };

  const summaryRows = [
    { label: 'Property', value: investment.title },
    { label: 'Location', value: investment.location },
    { label: 'Investment Type', value: investment.typeLabel },
    { label: 'Units / Slots', value: investment.unitsOwnedLabel },
    { label: 'Current Value', value: formatCurrency(investment.currentValue) },
    { label: 'Reference', value: investment.reference, mono: true },
    { label: 'Status', value: investment.statusLabel },
    { label: 'Date', value: formatDate(investment.startedAt ?? investment.createdAt) },
  ];

  const body = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Lottie + title */}
        <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
          <div className="flex justify-center mb-3">
            <Lottie
              animationData={confettiAnimation}
              loop={true}
              autoplay
              style={{ width: 160, height: 160 }}
            />
          </div>
          <h2 className="text-xl font-bold text-foreground">Investment Successful!</h2>
          <p className="text-sm text-foreground/50 mt-1 leading-snug">
            You have successfully invested in{' '}
            <span className="font-semibold text-foreground">{investment.title}</span>.
          </p>
        </div>

        {/* Amount + type badge */}
        <div className="mx-4 mb-4 bg-foreground/5 rounded-2xl px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-foreground/50 text-xs mb-0.5">Amount Invested</p>
            <p className="text-foreground font-bold text-2xl leading-none mt-1">
              {formatCurrency(investment.totalInvested)}
            </p>
          </div>
          <span
            className={cn(
              'text-white text-xs font-semibold px-3 py-1.5 rounded-full shrink-0',
              MODEL_BADGE_COLORS[investment.type] ?? 'bg-accent'
            )}
          >
            {investment.typeLabel}
          </span>
        </div>

        {/* Investment summary */}
        <div className="mx-4 mb-4 bg-foreground/5 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-sm font-semibold text-foreground">Investment Summary</p>
          </div>
          <div className="divide-y divide-foreground/10">
            {summaryRows.map((row) => (
              <SummaryRow
                key={row.label}
                label={row.label}
                value={row.value}
                mono={row.mono}
              />
            ))}
          </div>
        </div>

        {/* Receipt note */}
        <div className="mx-4 mb-5 rounded-xl border border-accent/50 bg-accent/5 px-4 py-3 flex items-start gap-2.5">
          <RiFileTextLine className="text-lg shrink-0 mt-0.5 text-accent" />
          <p className="text-foreground/50 text-xs leading-relaxed">
            Your payment receipt has been sent to your email. You can also download it
            anytime from your portfolio.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-6 pt-3 border-t border-foreground/10 space-y-2.5 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleViewInvestment}
        >
          View Investment
          <RiArrowRightLine className="h-4 w-4 ml-1.5" />
        </Button>
        <button
          onClick={handleGoHome}
          className="w-full text-center text-foreground/40 text-sm hover:text-foreground transition-colors py-1.5"
        >
          Back to Home
        </button>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 h-[92vh] flex flex-col overflow-hidden">
          <SheetTitle className="sr-only">Investment Successful</SheetTitle>
          <SheetDescription className="sr-only">
            Your investment in {investment.title} was successful.
          </SheetDescription>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg rounded-3xl overflow-hidden gap-0 max-h-[95vh] flex flex-col">
        <DialogTitle className="sr-only">Investment Successful</DialogTitle>
        <DialogDescription className="sr-only">
          Your investment in {investment.title} was successful.
        </DialogDescription>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function SummaryRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-foreground/50 shrink-0">{label}</span>
      <span
        className={cn(
          'text-xs text-foreground font-semibold text-right break-all',
          mono && 'font-mono text-foreground/60'
        )}
      >
        {value}
      </span>
    </div>
  );
}
