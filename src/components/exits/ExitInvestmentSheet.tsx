import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RiCheckLine, RiHistoryLine, RiInformationLine, RiLockLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCreateExit, useEligibleExits } from '@/hooks/useExits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { formatCurrency, cn } from '@/lib/utils';
import type { ExitRequest, Investment } from '@/types';
import { ExitPropertyCard } from './ExitPropertyCard';
import { SummaryRow } from './ExitDetailSheet';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
// Default exit fee from the API docs (admin-configurable); the final figure comes back on the exit
const EXIT_FEE_RATE = 0.05;

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="bg-card px-4 pt-4 pb-5 shrink-0 space-y-3">{children}</div>;
}

function DetailRow({ label, value, info }: { label: string; value: string; info?: string }) {
  return (
    <div className="border-b border-foreground/10 last:border-0 py-1">
      <SummaryRow label={label} value={value} valueClass="font-normal" info={info} />
    </div>
  );
}

interface Props {
  inv: Investment;
  open: boolean;
  onClose: () => void;
  /** Opens Exit Details for the request just submitted */
  onViewStatus: (exitId: string) => void;
}

/** Exit a fractional holding (Figma, Oct 2026): review the payout estimate → submitted. */
export function ExitInvestmentSheet({ inv, open, onClose, onViewStatus }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const { eligible } = useEligibleExits();
  const createMutation = useCreateExit();
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState<ExitRequest | null>(null);

  const eligibility = eligible.find((e) => e.investmentId === inv.id);
  const blockedReason = eligibility && !eligibility.isEligible ? eligibility.ineligibilityReason : null;

  const gain = inv.currentValue - inv.totalInvested;
  const fee = inv.currentValue * EXIT_FEE_RATE;
  const payout = Math.max(0, inv.currentValue - fee);
  const isSaveToOwn = inv.type === 'save_to_own';
  const ownership =
    inv.ownershipLabel?.match(/[\d.]+\s*%/)?.[0] ??
    (isSaveToOwn ? `${Number(inv.progressPercent.toFixed(2))}%` : '—');
  const slots = inv.unitsOwnedLabel;
  const outstanding = Math.max(0, (inv.totalCommitment ?? 0) - inv.totalInvested);
  const investedLabel = isSaveToOwn ? 'Amount Saved' : 'Amount Invested';

  const close = () => {
    setAgreed(false);
    setSubmitted(null);
    onClose();
  };

  const handleSubmit = () => {
    createMutation.mutate(
      { investmentId: inv.id, termsAccepted: true },
      {
        onSuccess: (res) => {
          const raw = res as unknown as Record<string, unknown>;
          setSubmitted(((raw?.data ?? raw) as ExitRequest) ?? null);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit exit request'),
      },
    );
  };

  // Save-to-own design (Oct 2026): 2×2 stats with the model badge; fractional keeps one row
  const stats = isSaveToOwn
    ? [
        { label: 'Units', value: slots },
        { label: 'Ownership', value: ownership },
        { label: 'Amount Saved', value: formatCurrency(inv.totalInvested) },
        { label: 'Current Value', value: formatCurrency(inv.currentValue) },
      ]
    : [
        { label: 'Ownership', value: ownership },
        { label: 'Slots', value: slots },
        { label: 'Invested', value: formatCurrency(inv.totalInvested) },
        { label: 'Current Value', value: formatCurrency(inv.currentValue) },
      ];

  const body = (
    <TooltipProvider delayDuration={150}>
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">Exit Investment</DialogTitle>
      </div>

      {!submitted ? (
        <>
          <div className="flex gap-2 px-4 pb-4 shrink-0">
            <div className="flex-1 h-2 rounded-full bg-green-600" />
            <div className="flex-1 h-2 rounded-full bg-foreground/10" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-4">
            <div>
              <h2 className="text-foreground font-bold text-2xl">Review Exit Request</h2>
              <p className="text-foreground/50 text-sm mt-1">
                Please review your payout estimate before submitting your exit request.
              </p>
            </div>
            <ExitPropertyCard
              imageUrl={inv.propertyImageUrl}
              title={inv.title}
              location={inv.location}
              stats={stats}
              type={isSaveToOwn ? inv.type : undefined}
              typeLabel={isSaveToOwn ? inv.typeLabel : undefined}
              twoByTwo={isSaveToOwn}
            />

            <div className={cn(CARD, 'px-4 pt-4 pb-2')}>
              <h2 className="text-foreground font-bold text-sm pb-3 mb-1 border-b border-foreground/10">Payout Summary</h2>
              {isSaveToOwn ? (
                <>
                  <SummaryRow label="Amount Saved" value={formatCurrency(inv.totalInvested)} />
                  <SummaryRow
                    label="Outstanding balance"
                    value={formatCurrency(outstanding)}
                    valueClass="text-red-600 dark:text-red-400"
                  />
                </>
              ) : (
                <>
                  <SummaryRow
                    label="Current Value"
                    value={formatCurrency(inv.currentValue)}
                    valueClass="text-green-600 dark:text-green-400"
                  />
                  <SummaryRow
                    label="Investment gain"
                    value={formatCurrency(gain)}
                    valueClass={gain >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
                  />
                </>
              )}
              <SummaryRow
                label={`Exit fee (${(EXIT_FEE_RATE * 100).toFixed(1)}%)`}
                value={`-${formatCurrency(fee)}`}
                info="Charged on the current value of your holding when you exit."
              />
              <div className="border-t border-foreground/10 mt-1 pt-1">
                <SummaryRow
                  label={isSaveToOwn ? 'Est. Amount to be paid' : 'Estimate payout'}
                  value={formatCurrency(payout)}
                />
              </div>
            </div>

            <div className="bg-foreground/10 rounded-3xl p-4 flex items-start gap-3">
              <RiInformationLine className="h-5 w-5 text-foreground shrink-0 mt-0.5" />
              <p className="text-foreground/60 text-sm leading-relaxed">
                Your exit request will be reviewed within 1-2 business days. The estimated payout is based on the current
                valuation and may change before completion.
              </p>
            </div>

            {blockedReason && (
              <div className="bg-red-100 dark:bg-red-500/15 rounded-3xl p-4 text-red-700 dark:text-red-300 text-sm">
                {blockedReason}
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-accent w-5 h-5 shrink-0"
              />
              <span className="text-sm text-foreground/50 leading-relaxed">
                I have reviewed and agree to the exit <span className="text-accent">terms and conditions.</span>
              </span>
            </label>
          </div>
          <Footer>
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={handleSubmit}
              disabled={!agreed || !!blockedReason || createMutation.isPending}
            >
              {createMutation.isPending ? 'Submitting…' : 'Confirm Exit Request'}
            </Button>
            <p className="text-center text-foreground/50 text-sm flex items-center justify-center gap-2">
              <RiLockLine className="h-4 w-4" />
              Your information is secure and protected.
            </p>
          </Footer>
        </>
      ) : (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-3">
            <div className="bg-green-100 dark:bg-green-500/15 rounded-3xl px-4 py-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                <RiCheckLine className="h-8 w-8 text-white" />
              </div>
              <p className="text-foreground font-bold text-xl mt-4">Exit Request Submitted</p>
              <p className="text-foreground/50 text-sm mt-1">Your request for {inv.title} is now under review</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-500/15 rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <RiHistoryLine className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">Under review</p>
              </div>
              <p className="text-foreground text-sm leading-relaxed mt-2">
                Our team typically reviews exit requests within 1-2 business days. You'll receive a notification once
                there's an update.
              </p>
            </div>
            <div>
              {submitted.reference && <DetailRow label="Exit ID" value={submitted.reference} />}
              <DetailRow label="Property name" value={inv.title} />
              <DetailRow label={investedLabel} value={formatCurrency(inv.totalInvested)} />
              <DetailRow label="Ownership" value={ownership} />
              <DetailRow
                label={`Exit fee (${(EXIT_FEE_RATE * 100).toFixed(1)}%)`}
                value={formatCurrency(fee)}
                info="Charged on the current value of your holding when you exit."
              />
              <DetailRow label="Est. Amount to be Paid" value={formatCurrency(submitted.amount ?? payout)} />
            </div>
          </div>
          <Footer>
            <div className="flex gap-3">
              <Button
                className="flex-1 h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
                disabled={!submitted.id}
                onClick={() => {
                  const id = submitted.id;
                  close();
                  onViewStatus(id);
                }}
              >
                View Exit Status
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-14 bg-foreground/10 hover:bg-foreground/15 text-foreground/60 font-semibold rounded-2xl text-base"
                onClick={() => {
                  close();
                  navigate('/investor/exits');
                }}
              >
                View My Exits
              </Button>
            </div>
          </Footer>
        </>
      )}
    </TooltipProvider>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      {isMobile ? (
        <SheetContent side="bottom" className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[92vh] rounded-t-3xl">
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] h-[90vh] rounded-3xl">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
}
