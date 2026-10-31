import { useEffect, useState } from 'react';
import {
  RiExchangeLine,
  RiArrowLeftLine,
  RiInformationLine,
  RiBuildingLine,
  RiMapPinLine,
  RiIndeterminateCircleLine,
  RiAddCircleLine,
  RiLockLine,
  RiCheckLine,
} from 'react-icons/ri';
import { useCreateResale } from '@/hooks/useResales';
import { formatCurrency, cn } from '@/lib/utils';
import { MODEL_BADGE } from '@/components/investment/modelBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import type { EligibleInvestment } from '@/types';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';

type Step = 'select' | 'set-price' | 'review' | 'sent';
const STEPS: Step[] = ['select', 'set-price', 'review'];

// Co-development is sold in slots, land banking in plots, every other model in units
const nounFor = (type?: string) => (type === 'co_development' ? 'slot' : type === 'land_banking' ? 'plot' : 'unit');
const countLabel = (n: number, noun: string) => `${n} ${noun}${n !== 1 ? 's' : ''}`;
const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ─── Progress bar (Figma, Oct 2026): one green segment per completed step ─────

function Progress({ step, steps }: { step: Step; steps: Step[] }) {
  const idx = steps.indexOf(step);
  return (
    <div className="flex gap-2 px-4 pb-4 shrink-0">
      {steps.map((s, i) => (
        <div key={s} className={cn('flex-1 h-2 rounded-full', i <= idx ? 'bg-green-600' : 'bg-foreground/10')} />
      ))}
    </div>
  );
}

// ─── Investment summary card (used in all 3 steps) ────────────────────────────

function InvCard({ inv, selected, onSelect }: { inv: EligibleInvestment; selected?: boolean; onSelect?: () => void }) {
  const selectable = onSelect !== undefined && inv.isEligible;
  // Co-development and land banking designs (Oct 2026): model badge under the title and three stats; others keep four
  const isLandBanking = inv.investmentType === 'land_banking';
  const isCoDev = inv.investmentType === 'co_development';
  const compact = isCoDev || isLandBanking;
  const appreciation = inv.currentValue - inv.investedAmount;
  const stats: { label: string; value: string; cls?: string }[] = isLandBanking
    ? [
        { label: 'Total Invested', value: formatCurrency(inv.investedAmount) },
        { label: 'Current Value', value: formatCurrency(inv.currentValue) },
        {
          label: 'Appreciation',
          value: formatCurrency(appreciation),
          cls: appreciation >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
        },
      ]
    : isCoDev
    ? [
        { label: 'Slot Owned', value: titleCase(countLabel(inv.quantityOwned, 'slot')) },
        { label: 'Invested Amount', value: formatCurrency(inv.investedAmount) },
        { label: 'Current Value', value: formatCurrency(inv.currentValue) },
      ]
    : [
        { label: 'Ownership', value: inv.quantityLabel?.toLowerCase() ?? countLabel(inv.quantityOwned, 'unit') },
        { label: 'Type', value: inv.investmentTypeLabel },
        { label: 'Invested', value: formatCurrency(inv.investedAmount) },
        { label: 'Current value', value: formatCurrency(inv.currentValue), cls: onSelect ? 'text-green-600 dark:text-green-400' : undefined },
      ];
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={cn(
        CARD,
        'p-3 transition-colors',
        selectable ? 'cursor-pointer' : 'cursor-default',
        !inv.isEligible && 'opacity-60',
        selected && 'border-accent bg-accent/5',
      )}
    >
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
          {compact && (
            <span
              className={cn(
                'inline-block mt-1.5 text-xs font-medium px-3 py-0.5 rounded-full',
                MODEL_BADGE[inv.investmentType],
              )}
            >
              {inv.investmentTypeLabel}
            </span>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{inv.location}</span>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-2 mt-3 bg-foreground/5 rounded-2xl px-3 py-2.5',
          compact ? 'grid-cols-3 divide-x divide-foreground/10' : 'grid-cols-4',
        )}
      >
        {stats.map(({ label, value, cls }, i) => (
          <div
            key={label}
            className={cn('min-w-0', compact ? 'px-2 first:pl-0' : i === 0 && 'border-r border-foreground/10')}
          >
            <p className="text-foreground/50 text-xs truncate">{label}</p>
            <p className={cn('text-xs sm:text-sm mt-1 truncate', cls ?? 'text-foreground')}>{value}</p>
          </div>
        ))}
      </div>

      {!inv.isEligible && inv.ineligibilityReason && (
        <div className="mt-3 flex items-start gap-2 bg-foreground/5 rounded-xl px-3 py-2">
          <RiInformationLine className="h-3.5 w-3.5 text-foreground/40 mt-0.5 shrink-0" />
          <p className="text-foreground/50 text-[11px] leading-relaxed">{inv.ineligibilityReason}</p>
        </div>
      )}
    </div>
  );
}

// ─── Price input ──────────────────────────────────────────────────────────────

function PriceInput({ label, value, onChange }: { label: string; value: string; onChange: (raw: string) => void }) {
  return (
    <label className="block">
      <span className="text-foreground text-sm">{label}</span>
      <div className="mt-2 bg-foreground/5 border border-foreground/10 rounded-2xl flex items-center h-16 px-4 focus-within:border-accent">
        <span className="text-foreground font-bold text-2xl">₦</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder="0"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
          className="flex-1 min-w-0 bg-transparent text-foreground font-bold text-2xl outline-none placeholder:text-foreground/25"
        />
      </div>
    </label>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <div className="bg-card px-4 pt-4 pb-5 shrink-0 space-y-3">
      <Button
        className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
        onClick={onClick}
        disabled={disabled}
      >
        {label}
      </Button>
      <p className="text-center text-foreground/50 text-sm flex items-center justify-center gap-2">
        <RiLockLine className="h-4 w-4" />
        Your information is secure and protected.
      </p>
    </div>
  );
}

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface CreateResaleSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Investment chosen elsewhere (its details page): skips the picking step */
  preselectedId?: string | null;
  eligible: EligibleInvestment[];
  eligibleLoading: boolean;
}

export function CreateResaleSheet({ open, onOpenChange, preselectedId, eligible, eligibleLoading }: CreateResaleSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [step, setStep] = useState<Step>('select');
  const [selectedInv, setSelectedInv] = useState<EligibleInvestment | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [agreed, setAgreed] = useState(false);
  // True when opened on a preselected investment: only Set price and Review are shown
  const [direct, setDirect] = useState(false);
  const [preselectHandled, setPreselectHandled] = useState(false);

  const createMutation = useCreateResale();
  // What the "Sent for Review" screen shows after submitting
  const [sent, setSent] = useState<{ reference?: string; title: string; quantity: number; at: Date } | null>(null);

  const reset = () => {
    setSent(null);
    setStep('select');
    setSelectedInv(null);
    setQuantity(1);
    setMinPrice('');
    setMaxPrice('');
    setAgreed(false);
    setDirect(false);
    setPreselectHandled(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleBack = () => {
    if (step === 'set-price' && !direct) setStep('select');
    else if (step === 'review') setStep('set-price');
  };

  const ownedQty = selectedInv ? selectedInv.quantityOwned : 1;
  const noun = nounFor(selectedInv?.investmentType);
  const count = (n: number) => countLabel(n, noun);
  const currentValuePerUnit = selectedInv ? Math.floor(selectedInv.currentValue / Math.max(ownedQty, 1)) : 0;

  const numMin = parseInt(minPrice, 10) || 0;
  const numMax = parseInt(maxPrice, 10) || 0;

  const goToSetPrice = (inv: EligibleInvestment) => {
    setSelectedInv(inv);
    setQuantity(1);
    setMinPrice('');
    setMaxPrice(String(Math.floor(inv.currentValue / Math.max(inv.quantityOwned, 1))));
    setStep('set-price');
  };

  const handleSelectContinue = () => {
    if (!selectedInv) { toast.error('Please select an investment'); return; }
    goToSetPrice(selectedInv);
  };

  // Once the eligible list loads, jump straight to Set price for the preselected investment
  useEffect(() => {
    if (!open || !preselectedId || eligibleLoading || preselectHandled) return;
    setPreselectHandled(true);
    const inv = eligible.find((e) => e.investmentId === preselectedId);
    if (inv?.isEligible) {
      setDirect(true);
      goToSetPrice(inv);
    } else {
      toast.error(inv?.ineligibilityReason || 'This investment is not eligible for resale yet');
    }
  }, [open, preselectedId, eligibleLoading, eligible, preselectHandled]);

  const handlePriceContinue = () => {
    if (!numMin || !numMax) { toast.error('Enter both min and max price'); return; }
    if (numMin > numMax) { toast.error('Min price cannot exceed max price'); return; }
    if (numMax > currentValuePerUnit) {
      toast.error(`Max price cannot exceed current value per unit (${formatCurrency(currentValuePerUnit)})`);
      return;
    }
    setStep('review');
  };

  const handleSubmit = () => {
    if (!selectedInv || !agreed) { toast.error('Please accept the terms'); return; }
    createMutation.mutate(
      { investmentId: selectedInv.investmentId, quantity, minPricePerUnit: numMin, maxPricePerUnit: numMax, termsAccepted: true },
      {
        onSuccess: (res) => {
          const raw = res as unknown as Record<string, unknown>;
          const data = (raw?.data ?? raw) as { reference?: string } | null;
          setSent({ reference: data?.reference, title: selectedInv.title, quantity, at: new Date() });
          setStep('sent');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create listing'),
      },
    );
  };

  const display = (raw: string, n: number) => (raw ? n.toLocaleString('en-NG') : '');
  const priceRangeDisplay =
    minPrice && maxPrice
      ? numMin === numMax
        ? formatCurrency(numMin)
        : `${formatCurrency(numMin)} - ${formatCurrency(numMax)}`
      : '—';

  const body = (
    <>
      {/* Header: centred title, back on later steps; the modal's own close button sits top-right */}
      <div className="relative px-12 py-5 shrink-0">
        {step === 'review' || (step === 'set-price' && !direct) ? (
          <button
            onClick={handleBack}
            aria-label="Back"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
        ) : null}
        <DialogTitle className={cn('text-center text-base font-bold', step === 'sent' && 'sr-only')}>
          {step === 'sent' ? 'Sent for Review' : 'Resell My Investment'}
        </DialogTitle>
      </div>

      {step !== 'sent' && <Progress step={step} steps={direct ? STEPS.slice(1) : STEPS} />}

      {/* ── STEP 1: Select ── */}
      {step === 'select' && preselectedId && !preselectHandled && (
        <div className="flex-1 px-4 space-y-3">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-36 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      )}
      {step === 'select' && !(preselectedId && !preselectHandled) && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-3">
            <div>
              <h2 className="text-foreground font-bold text-2xl">Select investment</h2>
              <p className="text-foreground/50 text-sm mt-1">
                Choose an active investment that meets the resale eligibility requirements for its type.
              </p>
            </div>
            {eligibleLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-3xl" />)
            ) : !eligible.length ? (
              <EmptyState
                icon={<RiExchangeLine />}
                title="No eligible investments"
                description="Investments become eligible for resale after a minimum holding period."
              />
            ) : (
              eligible.map((inv) => (
                <InvCard
                  key={inv.investmentId}
                  inv={inv}
                  selected={selectedInv?.investmentId === inv.investmentId}
                  onSelect={() => setSelectedInv(inv)}
                />
              ))
            )}
          </div>
          <Footer label="Continue to Set Price" onClick={handleSelectContinue} disabled={!selectedInv} />
        </>
      )}

      {/* ── STEP 2: Set price ── */}
      {step === 'set-price' && selectedInv && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            <h2 className="text-foreground font-bold text-2xl">Set price</h2>
            <InvCard inv={selectedInv} />

            {/* Quantity */}
            <div>
              <p className="text-foreground font-bold text-base">Quantity to resell</p>
              <p className="text-foreground/50 text-sm mt-1 mb-3">Select how many whole {noun}s you want to list</p>
              <div className="bg-foreground/10 rounded-3xl flex items-center gap-3 p-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Fewer units"
                  className="w-11 h-11 flex items-center justify-center text-foreground disabled:opacity-30 shrink-0"
                >
                  <RiIndeterminateCircleLine className="h-8 w-8" />
                </button>
                <div className="flex-1 bg-background rounded-2xl py-3 text-center">
                  <p className="text-foreground font-bold text-2xl">
                    {noun === 'unit' ? count(quantity) : titleCase(count(quantity))}
                  </p>
                  <p className="text-foreground/50 text-sm mt-0.5">{count(ownedQty)} owned</p>
                </div>
                <button
                  onClick={() => setQuantity((q) => Math.min(ownedQty, q + 1))}
                  disabled={quantity >= ownedQty}
                  aria-label="More units"
                  className="w-11 h-11 flex items-center justify-center text-foreground disabled:opacity-30 shrink-0"
                >
                  <RiAddCircleLine className="h-8 w-8" />
                </button>
              </div>
            </div>

            {/* Price range */}
            <div className="space-y-4">
              <div>
                <p className="text-foreground font-bold text-base">Set your price range per {noun}</p>
                <p className="text-foreground/50 text-sm mt-1">
                  Enter the minimum and maximum price you are willing to accept
                </p>
              </div>
              <PriceInput label={`Minimum price per ${noun}`} value={display(minPrice, numMin)} onChange={setMinPrice} />
              <div>
                <PriceInput label={`Maximum price per ${noun}`} value={display(maxPrice, numMax)} onChange={setMaxPrice} />
                <p className="text-foreground/50 text-sm mt-2">
                  Maximum allowed per {noun}: <span className="font-bold">{formatCurrency(currentValuePerUnit)}</span>
                </p>
                {maxPrice && numMax > currentValuePerUnit && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">Max price cannot exceed current value per {noun}.</p>
                )}
                {minPrice && maxPrice && numMin > numMax && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">Min price cannot exceed max price.</p>
                )}
              </div>
            </div>
          </div>
          <Footer
            label="Continue to Review"
            onClick={handlePriceContinue}
            disabled={!numMin || !numMax || numMin > numMax || numMax > currentValuePerUnit}
          />
        </>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 'review' && selectedInv && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 space-y-5">
            <div>
              <h2 className="text-foreground font-bold text-2xl">Review Your Resale Listing</h2>
              <p className="text-foreground/50 text-sm mt-1">Your listing will be sent to our team for review</p>
            </div>

            <InvCard inv={selectedInv} />

            <div>
              <p className="text-foreground font-bold text-base mb-1">Resale Details</p>
              {[
                { label: 'Quantity to Resell', value: count(quantity) },
                { label: 'Price Range per unit', value: priceRangeDisplay },
                { label: 'Investment Type', value: selectedInv.investmentTypeLabel },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 py-3.5 border-b border-foreground/10 last:border-0"
                >
                  <span className="text-foreground/50 text-sm shrink-0">{row.label}</span>
                  <span className="text-foreground text-sm text-right">{row.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-foreground/10 rounded-3xl p-4">
              <p className="text-foreground font-bold text-base mb-3">Important to Note</p>
              <ul className="list-disc pl-5 space-y-1 text-foreground/50 text-sm leading-relaxed">
                <li>Your listing will be visible to other NeedHomes investors</li>
                <li>Once a buyer purchases your shares, the amount will be credited to your wallet.</li>
                <li>NeedHomes charges a processing fee of 1.5% on successful resales.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-accent w-5 h-5 shrink-0"
              />
              <span className="text-sm text-foreground/50 leading-relaxed">
                I have reviewed and agree to the resale <span className="text-accent">terms and conditions.</span>
              </span>
            </label>
          </div>
          <Footer
            label={createMutation.isPending ? 'Submitting…' : 'Send for Review'}
            onClick={handleSubmit}
            disabled={!agreed || createMutation.isPending}
          />
        </>
      )}

      {/* ── Sent for review (Figma, Oct 2026) ── */}
      {step === 'sent' && sent && (
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
          <div className="flex flex-col items-center text-center pt-2">
            <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center">
              <RiCheckLine className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-foreground font-bold text-2xl mt-5">Sent for Review</h2>
            <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
              Your request for <span className="font-semibold text-foreground/70">{sent.title}</span> resell has been
              submitted successfully. You'll receive a response from us when we have any update about your resale.
            </p>
          </div>
          <div className={cn(CARD, 'p-4 mt-5')}>
            <h3 className="text-foreground font-bold text-base mb-1">Listing Details</h3>
            {[
              ...(sent.reference ? [{ label: 'Reference', value: sent.reference }] : []),
              { label: 'Name', value: sent.title },
              { label: noun === 'unit' ? 'Units' : `${noun.charAt(0).toUpperCase()}${noun.slice(1)}s`, value: count(sent.quantity) },
              {
                label: 'Date & Time',
                value: `${sent.at.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })} ${sent.at.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: false })}`,
              },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-4 py-3.5 border-b border-foreground/10 last:border-0"
              >
                <span className="text-foreground/50 text-sm shrink-0">{row.label}</span>
                <span className="text-foreground text-sm text-right">{row.value}</span>
              </div>
            ))}
            <Button
              className="w-full h-14 mt-3 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={() => handleClose(false)}
            >
              Proceed
            </Button>
          </div>
        </div>
      )}
    </>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[92vh] rounded-t-3xl"
        >
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
