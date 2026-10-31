import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddCircleLine,
  RiArrowLeftLine,
  RiBuildingLine,
  RiCheckLine,
  RiHistoryLine,
  RiIndeterminateCircleLine,
  RiLockLine,
  RiMapPinLine,
} from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MODEL_BADGE } from '@/components/investment/modelBadge';
import { useCreateBuyback } from '@/hooks/useBuybacks';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { formatCurrency, cn } from '@/lib/utils';
import type { Investment } from '@/types';
import type { BuybackDetail } from '@/api/buybacks.api';
import { DetailRow } from './BuyBackDetailSheet';
import { BUYBACK_FEE_RATE, buybackAmounts } from './buyback';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
type Step = 'request' | 'review' | 'submitted';

const plotsLabel = (n: number) => `${n} plot${n !== 1 ? 's' : ''}`;
const PlotsTitle = (n: number) => `${n} Plot${n !== 1 ? 's' : ''}`;

/** Plots owned: the detail response's quantity, else the number in "3 Plots" */
const ownedPlots = (inv: Investment) =>
  inv.quantity ?? (parseInt(inv.unitsOwnedLabel ?? '', 10) || inv.numberOfPlots || 1);

function InvSummary({ inv }: { inv: Investment }) {
  const appreciation = inv.currentValue - inv.totalInvested;
  return (
    <div className={cn(CARD, 'p-3')}>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
          {inv.propertyImageUrl ? (
            <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
              <RiBuildingLine className="h-6 w-6 text-accent" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-base leading-tight line-clamp-2">{inv.title}</p>
          <span className={cn('inline-block mt-1.5 text-xs font-medium px-3 py-0.5 rounded-full', MODEL_BADGE[inv.type])}>
            {inv.typeLabel}
          </span>
          <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{inv.location}</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl px-3 py-2.5">
        {[
          { label: 'Total Invested', value: formatCurrency(inv.totalInvested), cls: 'text-foreground', align: 'text-left' },
          { label: 'Current Value', value: formatCurrency(inv.currentValue), cls: 'text-foreground', align: 'text-center' },
          {
            label: 'Appreciation',
            value: formatCurrency(appreciation),
            cls: appreciation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
            align: 'text-right',
          },
        ].map(({ label, value, cls, align }) => (
          <div key={label} className={cn('min-w-0 px-2 first:pl-0 last:pr-0', align)}>
            <p className="text-foreground/50 text-xs truncate">{label}</p>
            <p className={cn('text-xs sm:text-sm font-bold mt-1 truncate', cls)}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="bg-card px-4 pt-4 pb-5 shrink-0 space-y-3">{children}</div>;
}

const Secure = () => (
  <p className="text-center text-foreground/50 text-sm flex items-center justify-center gap-2">
    <RiLockLine className="h-4 w-4" />
    Your information is secure and protected.
  </p>
);

const NOTES = [
  'Your request will be reviewed by the NeedHomes team, and you may be contacted if additional information is required.',
  'The NeedHomes team will contact you via your registered email address or other official communication channels to discuss and agree on the buy-back price.',
  'Once the final price is agreed upon, NeedHomes will update the agreed amount in the system and approve the buy-back request.',
  'An applicable buy-back processing fee will be deducted from the agreed buy-back amount. Once the price and applicable fee are confirmed, NeedHomes will update and approve the request.',
];

interface Props {
  inv: Investment;
  open: boolean;
  onClose: () => void;
  /** Opens the Buy Back Details for the request just submitted */
  onViewStatus: (buybackId: string) => void;
}

export function BuyBackSheet({ inv, open, onClose, onViewStatus }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const createMutation = useCreateBuyback();

  const owned = ownedPlots(inv);
  const valuePerPlot = inv.currentValue / Math.max(owned, 1);
  const [step, setStep] = useState<Step>('request');
  const [quantity, setQuantity] = useState(1);
  const [priceInput, setPriceInput] = useState(String(Math.round(valuePerPlot)));
  const [submitted, setSubmitted] = useState<BuybackDetail | null>(null);

  const price = parseInt(priceInput, 10) || 0;

  const reset = () => {
    setStep('request');
    setQuantity(1);
    setPriceInput(String(Math.round(valuePerPlot)));
    setSubmitted(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const changeQuantity = (q: number) => {
    setQuantity(q);
    setPriceInput(String(Math.round(valuePerPlot * q)));
  };

  const handleSubmit = () => {
    createMutation.mutate(
      { investmentId: inv.id, quantity, proposedPrice: price },
      {
        onSuccess: (res) => {
          setSubmitted({ ...res, id: res?.id ?? '', status: res?.status ?? 'pending' });
          setStep('submitted');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit buy-back request'),
      },
    );
  };

  // After submitting, show what the API returned, filling gaps from what was entered
  const result: BuybackDetail | null = submitted && {
    reference: inv.reference,
    investmentTypeLabel: inv.typeLabel,
    quantity,
    proposedPrice: price,
    processingFeeRate: BUYBACK_FEE_RATE,
    ...submitted,
  };

  const body = (
    <TooltipProvider delayDuration={150}>
      <div className="relative px-12 py-5 shrink-0">
        {step === 'review' && (
          <button
            onClick={() => setStep('request')}
            aria-label="Back"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
        )}
        <DialogTitle className="text-center text-base font-bold">Buy Back</DialogTitle>
      </div>

      {step !== 'submitted' && (
        <div className="flex gap-2 px-4 pb-4 shrink-0">
          <div className="flex-1 h-2 rounded-full bg-green-600" />
          <div className={cn('flex-1 h-2 rounded-full', step === 'review' ? 'bg-green-600' : 'bg-foreground/10')} />
        </div>
      )}

      {/* ── Request ── */}
      {step === 'request' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            <h2 className="text-foreground font-bold text-2xl">Request a Buy Back</h2>
            <InvSummary inv={inv} />
            <div>
              <p className="text-foreground font-bold text-base">Plots to Buy Back</p>
              <p className="text-foreground/50 text-sm mt-1 mb-3">
                Select the number of plots you want to request for buy-back.
              </p>
              <div className="bg-foreground/10 rounded-3xl flex items-center gap-3 p-3">
                <button
                  onClick={() => changeQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Fewer plots"
                  className="w-11 h-11 flex items-center justify-center text-foreground disabled:opacity-30 shrink-0"
                >
                  <RiIndeterminateCircleLine className="h-8 w-8" />
                </button>
                <div className="flex-1 bg-background rounded-2xl py-3 text-center">
                  <p className="text-foreground font-bold text-2xl">{PlotsTitle(quantity)}</p>
                  <p className="text-foreground/50 text-sm mt-0.5">{plotsLabel(owned)} owned</p>
                </div>
                <button
                  onClick={() => changeQuantity(Math.min(owned, quantity + 1))}
                  disabled={quantity >= owned}
                  aria-label="More plots"
                  className="w-11 h-11 flex items-center justify-center text-foreground disabled:opacity-30 shrink-0"
                >
                  <RiAddCircleLine className="h-8 w-8" />
                </button>
              </div>
            </div>
            <label className="block">
              <span className="text-foreground text-sm">Proposed Buy-Back Price</span>
              <div className="mt-2 bg-foreground/5 border border-foreground/10 rounded-2xl flex items-center h-16 px-4 focus-within:border-accent">
                <span className="text-foreground font-bold text-2xl">₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={priceInput ? price.toLocaleString('en-NG') : ''}
                  onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 bg-transparent text-foreground font-bold text-2xl outline-none placeholder:text-foreground/25"
                />
              </div>
            </label>
          </div>
          <Footer>
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={() => setStep('review')}
              disabled={price <= 0}
            >
              Continue to Review
            </Button>
            <Secure />
          </Footer>
        </>
      )}

      {/* ── Review ── */}
      {step === 'review' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            <div>
              <h2 className="text-foreground font-bold text-2xl">Review Your Buy-Back Request</h2>
              <p className="text-foreground/50 text-sm mt-1">Your request will be sent to our team for review</p>
            </div>
            <InvSummary inv={inv} />
            <div>
              <p className="text-foreground font-bold text-base mb-1">Buy-Back Details</p>
              <DetailRow label="Quantity" value={plotsLabel(quantity)} />
              <DetailRow label="Investment Type" value={inv.typeLabel} />
              <DetailRow label="Proposed Buy-Back Price" value={formatCurrency(price)} />
            </div>
            <div className="bg-foreground/10 rounded-3xl p-4">
              <p className="text-foreground font-bold text-base mb-3">Important to Note</p>
              <div className="space-y-3 text-foreground/50 text-sm leading-relaxed">
                {NOTES.map((n) => (
                  <p key={n}>{n}</p>
                ))}
                <p>
                  Once approved, the agreed buy-back amount will be paid to you{' '}
                  <span className="font-bold">within 48 hours.</span>
                </p>
              </div>
            </div>
          </div>
          <Footer>
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Submitting…' : 'Buy Back'}
            </Button>
            <Secure />
          </Footer>
        </>
      )}

      {/* ── Submitted ── */}
      {step === 'submitted' && result && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-3">
            <div className="bg-green-100 dark:bg-green-500/15 rounded-3xl px-4 py-6 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                <RiCheckLine className="h-8 w-8 text-white" />
              </div>
              <p className="text-foreground font-bold text-xl mt-4">Buy Back Request Submitted</p>
              <p className="text-foreground/50 text-sm mt-1">Your request for {inv.title} is now under review</p>
            </div>
            <div className="bg-amber-100 dark:bg-amber-500/15 rounded-3xl p-4">
              <div className="flex items-center gap-3">
                <RiHistoryLine className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">Under review</p>
              </div>
              <p className="text-foreground text-sm leading-relaxed mt-2">
                The NeedHomes team will contact you via your registered email address or other official communication
                channels to discuss and agree on the buy-back price.
              </p>
            </div>
            <div>
              {result.reference && <DetailRow label="Reference" value={result.reference} />}
              <DetailRow label="Investment type" value={result.investmentTypeLabel ?? inv.typeLabel} />
              <DetailRow label="Quantity" value={PlotsTitle(result.quantity ?? quantity)} />
              <DetailRow label="Proposed Buy-Back Price" value={formatCurrency(result.proposedPrice ?? price)} />
              <DetailRow
                label={`Processing fee (${(buybackAmounts(result).feeRate * 100).toFixed(1)}%)`}
                value={formatCurrency(buybackAmounts(result).fee)}
                info="Deducted from the agreed buy-back amount."
              />
            </div>
          </div>
          <Footer>
            <div className="flex gap-3">
              <Button
                className="flex-1 h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
                onClick={() => {
                  const id = result.id;
                  close();
                  if (id) onViewStatus(id);
                }}
                disabled={!result.id}
              >
                View Status
              </Button>
              <Button
                variant="secondary"
                className="flex-1 h-14 bg-foreground/10 hover:bg-foreground/15 text-foreground/60 font-semibold rounded-2xl text-base"
                onClick={() => {
                  close();
                  navigate('/investor/buybacks');
                }}
              >
                View All
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
