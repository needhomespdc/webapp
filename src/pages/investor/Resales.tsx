import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiExchangeLine,
  RiStoreLine,
  RiTimeLine,
  RiAddLine,
  RiArrowLeftLine,
  RiInformationLine,
  RiCheckLine,
  RiPieChart2Line,
  RiArchiveLine,
  RiSubtractLine,
  RiBook2Line,
  RiBuildingLine,
} from 'react-icons/ri';
import {
  useEligibleResales,
  useMyResales,
  useCreateResale,
  useCancelResale,
  useDeleteResale,
} from '@/hooks/useResales';
import { formatCurrency, formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { cn } from '@/lib/utils';
import type { ResaleListing, EligibleInvestment } from '@/types';

// ─── 3-step sheet ─────────────────────────────────────────────────────────────

type Step = 'select' | 'set-price' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'select', label: 'Select Investment' },
  { key: 'set-price', label: 'Set Price' },
  { key: 'review', label: 'Review' },
];

function Stepper({ step }: { step: Step }) {
  const currentIdx = STEPS.findIndex((s) => s.key === step);
  return (
    <div className="px-5 py-3 shrink-0">
      <div className="flex items-center">
        {STEPS.map((s, i) => {
          const completed = i < currentIdx;
          const active = i === currentIdx;
          return (
            <Fragment key={s.key}>
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0',
                  completed || active
                    ? 'bg-accent border-accent text-white'
                    : 'bg-transparent border-foreground/20 text-foreground/30',
                )}
              >
                {completed ? <RiCheckLine className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn('flex-1 h-0.5', i < currentIdx ? 'bg-accent' : 'bg-foreground/15')}
                />
              )}
            </Fragment>
          );
        })}
      </div>
      <div className="flex items-start mt-1.5">
        {STEPS.map((s, i) => {
          const completed = i < currentIdx;
          const active = i === currentIdx;
          return (
            <Fragment key={s.key}>
              <p
                className={cn(
                  'w-8 text-center text-[10px] leading-tight shrink-0',
                  completed || active ? 'text-accent font-medium' : 'text-foreground/30',
                )}
              >
                {s.label}
              </p>
              {i < STEPS.length - 1 && <div className="flex-1" />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Investment summary card (used in all 3 steps) ────────────────────────────

function InvCard({ inv, selected, onSelect }: { inv: EligibleInvestment; selected?: boolean; onSelect?: () => void }) {
  const selectable = onSelect !== undefined && inv.isEligible;
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={cn(
        'border rounded-2xl p-4 transition-colors',
        selectable ? 'cursor-pointer' : 'cursor-default',
        !inv.isEligible ? 'opacity-60' : '',
        selected ? 'border-accent bg-accent/5' : 'border-foreground/10 bg-foreground/5',
        selectable && !selected ? 'hover:border-foreground/20' : '',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-foreground/10">
          {inv.propertyImageUrl ? (
            <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center"><RiBuildingLine className="h-6 w-6 text-foreground/30" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-sm leading-tight line-clamp-2">{inv.title}</p>
          <p className="text-foreground/50 text-xs mt-1">{inv.location}</p>
        </div>
        {onSelect !== undefined && (
          <div className={cn(
            'w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0',
            selected ? 'border-accent' : 'border-foreground/25',
          )}>
            {selected && <div className="w-3 h-3 rounded-full bg-accent" />}
          </div>
        )}
      </div>

      {/* Data grid */}
      <div className="border-t border-foreground/10 mt-3.5 pt-3.5 grid grid-cols-4 gap-2">
        <div>
          <p className="text-foreground/40 text-[10px] mb-0.5">Ownership</p>
          <p className="text-foreground text-xs font-semibold leading-tight">{inv.quantityLabel}</p>
        </div>
        <div>
          <p className="text-foreground/40 text-[10px] mb-0.5">Type</p>
          <p className="text-foreground text-xs font-semibold leading-tight truncate">{inv.investmentTypeLabel}</p>
        </div>
        <div>
          <p className="text-foreground/40 text-[10px] mb-0.5">Invested</p>
          <p className="text-foreground text-xs font-semibold leading-tight">{formatCurrency(inv.investedAmount)}</p>
        </div>
        <div>
          <p className="text-foreground/40 text-[10px] mb-0.5">Current Value</p>
          <p className="text-accent text-xs font-semibold leading-tight">{formatCurrency(inv.currentValue)}</p>
        </div>
      </div>

      {/* Ineligibility reason */}
      {!inv.isEligible && inv.ineligibilityReason && (
        <div className="mt-3 flex items-start gap-2 bg-foreground/5 rounded-xl px-3 py-2">
          <RiInformationLine className="h-3.5 w-3.5 text-foreground/40 mt-0.5 shrink-0" />
          <p className="text-foreground/50 text-[11px] leading-relaxed">{inv.ineligibilityReason}</p>
        </div>
      )}
    </div>
  );
}

// ─── Sheet content ─────────────────────────────────────────────────────────────

interface CreateResaleSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eligible: EligibleInvestment[];
  eligibleLoading: boolean;
}

function CreateResaleSheet({ open, onOpenChange, eligible, eligibleLoading }: CreateResaleSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [step, setStep] = useState<Step>('select');
  const [selectedInv, setSelectedInv] = useState<EligibleInvestment | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [agreed, setAgreed] = useState(false);

  const createMutation = useCreateResale();

  const reset = () => {
    setStep('select');
    setSelectedInv(null);
    setQuantity(1);
    setMinPrice('');
    setMaxPrice('');
    setAgreed(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleBack = () => {
    if (step === 'set-price') setStep('select');
    else if (step === 'review') setStep('set-price');
    else handleClose(false);
  };

  const handleSelectContinue = () => {
    if (!selectedInv) { toast.error('Please select an investment'); return; }
    setQuantity(1);
    setStep('set-price');
  };

  const handlePriceContinue = () => {
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    if (!min || !max) { toast.error('Enter both min and max price'); return; }
    if (min > max) { toast.error('Min price cannot exceed max price'); return; }
    setStep('review');
  };

  const handleSubmit = () => {
    if (!selectedInv || !agreed) { toast.error('Please accept the terms'); return; }
    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);
    createMutation.mutate(
      { investmentId: selectedInv.investmentId, quantity, minPricePerUnit: min, maxPricePerUnit: max, termsAccepted: true },
      {
        onSuccess: () => { toast.success('Resale listing submitted for review'); handleClose(false); },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to create listing'),
      },
    );
  };

  const ownedQty = selectedInv ? selectedInv.quantityOwned : 1;
  const pricePerUnitHint = selectedInv ? formatCurrency(selectedInv.currentValue / Math.max(ownedQty, 1)) : '';
  const priceRangeDisplay = minPrice && maxPrice
    ? (minPrice === maxPrice ? `${formatCurrency(parseFloat(minPrice))} per unit` : `${formatCurrency(parseFloat(minPrice))} – ${formatCurrency(parseFloat(maxPrice))} per unit`)
    : '—';

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <SheetTitle className="sr-only">Resell My Investment</SheetTitle>

      {/* Top header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/10 shrink-0 pr-14">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <p className="flex-1 text-foreground font-bold text-sm text-center">Resell My Investment</p>
      </div>

      {/* Stepper */}
      <Stepper step={step} />

      {/* ── STEP 1: Select ── */}
      {step === 'select' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-2">
            <div className="mb-3">
              <p className="text-foreground font-bold text-base">Select Investment to Resell</p>
              <p className="text-foreground/50 text-xs mt-0.5">
                Choose an active investment that meets the resale eligibility requirements for its type.
              </p>
            </div>
            {eligibleLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
              </div>
            ) : !eligible.length ? (
              <EmptyState
                icon={<RiExchangeLine />}
                title="No eligible investments"
                description="Investments become eligible for resale after a minimum holding period."
              />
            ) : (
              <div className="space-y-3">
                {eligible.map((inv) => (
                  <InvCard
                    key={inv.investmentId}
                    inv={inv}
                    selected={selectedInv?.investmentId === inv.investmentId}
                    onSelect={() => setSelectedInv(inv)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="px-4 pb-4 pt-3 border-t border-foreground/10 shrink-0">
            <Button
              className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2"
              onClick={handleSelectContinue}
              disabled={!selectedInv}
            >
              Continue to Set Price
              <span className="text-lg">›</span>
            </Button>
          </div>
        </>
      )}

      {/* ── STEP 2: Set Price ── */}
      {step === 'set-price' && selectedInv && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-5">
            <InvCard inv={selectedInv} />

            {/* Quantity */}
            <div>
              <p className="text-foreground font-bold text-sm mb-0.5">Quantity to resell</p>
              <p className="text-foreground/50 text-xs mb-3">Select how many whole units you want to list.</p>
              <div className="bg-foreground/5 border border-foreground/10 rounded-2xl flex items-center justify-between px-4 py-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-9 h-9 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors"
                >
                  <RiSubtractLine className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-foreground font-bold text-base">{quantity} {quantity === 1 ? 'Unit' : 'Units'}</p>
                  <p className="text-foreground/40 text-xs">{ownedQty} unit{ownedQty !== 1 ? 's' : ''} owned</p>
                </div>
                <button
                  onClick={() => setQuantity((q) => Math.min(ownedQty, q + 1))}
                  disabled={quantity >= ownedQty}
                  className="w-9 h-9 rounded-full border border-foreground/20 flex items-center justify-center text-foreground/60 hover:bg-foreground/10 disabled:opacity-30 transition-colors"
                >
                  <RiAddLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-foreground font-bold text-sm mb-0.5">Set your price range per unit</p>
              <p className="text-foreground/50 text-xs mb-3">
                Enter the minimum and maximum price you are willing to accept.
              </p>
              <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 space-y-4">
                <div>
                  <p className="text-foreground/50 text-xs mb-2">Minimum price per unit</p>
                  <div className="bg-background border border-foreground/10 rounded-xl flex items-center h-13 px-3 gap-2">
                    <span className="text-foreground/50 text-sm">₦</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-foreground/25"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-foreground/50 text-xs mb-2">Maximum price per unit</p>
                  <div className="bg-background border border-foreground/10 rounded-xl flex items-center h-13 px-3 gap-2">
                    <span className="text-foreground/50 text-sm">₦</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      placeholder="0"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-foreground/25"
                    />
                  </div>
                  {pricePerUnitHint && (
                    <p className="text-foreground/40 text-xs mt-2">
                      Current value per unit: {pricePerUnitHint}
                    </p>
                  )}
                </div>
                {minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice) && (
                  <p className="text-red-400 text-xs">Min price cannot exceed max price.</p>
                )}
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 pt-3 border-t border-foreground/10 shrink-0 space-y-2">
            <Button
              className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2"
              onClick={handlePriceContinue}
              disabled={!minPrice || !maxPrice || parseFloat(minPrice) > parseFloat(maxPrice)}
            >
              Continue to Review
              <span className="text-lg">›</span>
            </Button>
            <p className="text-center text-foreground/30 text-xs flex items-center justify-center gap-1.5">
              🔒 Your information is secure and protected.
            </p>
          </div>
        </>
      )}

      {/* ── STEP 3: Review ── */}
      {step === 'review' && selectedInv && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-5">
            <div>
              <p className="text-foreground font-bold text-base">Review Your Resale Listing</p>
              <p className="text-foreground/50 text-xs mt-0.5">
                Your listing will be sent to our team for review via support chat.
              </p>
            </div>

            <InvCard inv={selectedInv} />

            {/* Resale details */}
            <div>
              <p className="text-foreground font-bold text-sm mb-3">Resale Details</p>
              <div className="space-y-3">
                {[
                  {
                    icon: <RiPieChart2Line className="h-5 w-5 text-foreground/60" />,
                    label: 'Quantity to Resell',
                    value: `${quantity} ${quantity === 1 ? 'Unit' : 'Units'}`,
                  },
                  {
                    icon: <RiArchiveLine className="h-5 w-5 text-foreground/60" />,
                    label: 'Price Range per Unit',
                    value: priceRangeDisplay,
                  },
                  {
                    icon: <RiInformationLine className="h-5 w-5 text-foreground/60" />,
                    label: 'Investment Type',
                    value: selectedInv.investmentTypeLabel,
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-foreground/8 flex items-center justify-center shrink-0">
                      {row.icon}
                    </div>
                    <div>
                      <p className="text-foreground/40 text-xs">{row.label}</p>
                      <p className="text-foreground font-semibold text-sm mt-0.5">{row.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Important to note */}
            <div className="bg-accent/10 border border-accent/25 rounded-2xl p-4">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <RiInformationLine className="h-4.5 w-4.5 text-white" />
                </div>
                <p className="text-foreground font-semibold text-sm">Important to Note</p>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Your listing will be visible to other NeedHomes investors.',
                  'Once a buyer purchases your shares, the amount will be credited to your wallet.',
                  'NeedHomes charges a processing fee of 1.5% on successful resales.',
                ].map((item) => (
                  <li key={item} className="text-foreground/60 text-xs leading-relaxed flex items-start gap-1.5">
                    <span className="mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 accent-accent w-4 h-4 shrink-0"
              />
              <span className="text-sm text-foreground/60 leading-relaxed">
                I have reviewed and agree to the resale{' '}
                <span className="text-accent">terms and conditions</span>.
              </span>
            </label>
          </div>

          <div className="px-4 pb-4 pt-3 border-t border-foreground/10 shrink-0 space-y-2">
            <Button
              className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-base"
              onClick={handleSubmit}
              disabled={!agreed || createMutation.isPending}
            >
              {createMutation.isPending ? 'Submitting…' : 'Send for Review'}
            </Button>
            <p className="text-center text-foreground/30 text-xs flex items-center justify-center gap-1.5">
              🔒 Your information is secure and protected.
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden',
          isMobile ? 'rounded-t-2xl h-[92vh]' : 'h-full sm:max-w-md',
        )}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}

// ─── Listing card ─────────────────────────────────────────────────────────────

function ResaleListingCard({ listing }: { listing: ResaleListing }) {
  const cancelMutation = useCancelResale();
  const deleteMutation = useDeleteResale();

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-foreground text-sm font-semibold line-clamp-1">
          {listing.investment?.title ?? 'Investment'}
        </p>
        <StatusBadge status={listing.status} />
      </div>
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-foreground/40">Quantity</p>
          <p className="text-foreground font-medium">{listing.quantity} unit{listing.quantity !== 1 ? 's' : ''}</p>
        </div>
        <div>
          <p className="text-foreground/40">Min / Unit</p>
          <p className="text-foreground font-medium">{formatCurrency(listing.minPricePerUnit)}</p>
        </div>
        <div>
          <p className="text-foreground/40">Max / Unit</p>
          <p className="text-foreground font-medium">{formatCurrency(listing.maxPricePerUnit)}</p>
        </div>
      </div>
      <p className="text-foreground/30 text-xs mt-2">Listed {formatDate(listing.createdAt)}</p>
      {listing.rejectionReason && (
        <p className="text-red-400 text-xs mt-2 bg-red-500/10 rounded-lg px-3 py-2">{listing.rejectionReason}</p>
      )}
      {listing.status === 'pending' && (
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
            onClick={() => cancelMutation.mutate(listing.id, { onError: () => toast.error('Failed to cancel') })}
            disabled={cancelMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            onClick={() => deleteMutation.mutate(listing.id, { onError: () => toast.error('Failed to delete') })}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<string, string> = { all: 'All', pending: 'Pending', live: 'Live', sold: 'Sold' };

export default function Resales() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  const { eligible, isLoading: eligibleLoading } = useEligibleResales();
  const { resales, summary, isLoading } = useMyResales();

  const totalListings = summary.liveCount + summary.pendingCount;
  const pendingCount = summary.pendingCount;

  const filtered = (() => {
    if (tab === 'pending') return resales.filter((r) => r.status === 'pending');
    if (tab === 'live') return resales.filter((r) => r.status === 'approved');
    if (tab === 'sold') return resales.filter((r) => r.status === 'sold');
    return resales;
  })();

  return (
    <div className="space-y-5 sm:pb-24">
      {/* Header with back */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Property Resales</h1>
          <p className="text-foreground/50 text-xs mt-0.5">List your holdings for resale and track your listing status.</p>
        </div>
      </div>

      {/* Inline CTA — mobile only */}
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl sm:hidden"
        onClick={() => setCreateOpen(true)}
      >
        <RiAddLine className="h-5 w-5 mr-2" />
        Resell my investment
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <RiStoreLine className="text-accent h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Total Listings</p>
            <p className="text-foreground font-bold text-xl leading-tight">
              {isLoading ? '—' : totalListings}
            </p>
          </div>
        </div>
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-blue-400 h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Pending Review</p>
            <p className="text-foreground font-bold text-xl leading-tight">
              {isLoading ? '—' : pendingCount}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs — underline style */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-transparent border-0 p-0 rounded-none gap-0 flex border-b border-foreground/10">
          {Object.keys(TAB_LABELS).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn(
                'flex-1 rounded-none pb-2.5 pt-1 px-2 bg-transparent shadow-none border-b-2 border-transparent -mb-px',
                'data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                'text-foreground/40 text-sm font-medium',
              )}
            >
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-28 w-full rounded-2xl" />)}
            </div>
          ) : !filtered.length ? (
            <div className="bg-foreground/5 border border-foreground/10 rounded-2xl py-10 px-4 flex flex-col items-center text-center gap-3">
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-foreground/5">
                <RiBook2Line className="h-7 w-7 text-foreground/30" />
              </div>
              <p className="text-foreground font-semibold text-sm">No resale listings yet</p>
              <p className="text-foreground/40 text-xs">
                When you list a property for resale, your listings will show here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((listing) => (
                <ResaleListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* What you should know */}
      <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4">
        <p className="text-foreground font-semibold text-sm mb-3">What you should know</p>
        <ul className="space-y-2">
          {[
            'You can resell any of your active investments that have not been claimed or handed over.',
            'Once your shares are sold, the proceeds will be credited to your wallet.',
            'Resale is subject to market demand and may take time to complete.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-1.5 text-foreground/60 text-xs leading-relaxed">
              <span className="mt-1 shrink-0">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Sheet */}
      <CreateResaleSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        eligible={eligible}
        eligibleLoading={eligibleLoading}
      />

      {/* FAB — desktop only */}
      <button
        onClick={() => setCreateOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-8 z-40 items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-95"
      >
        <RiAddLine className="h-5 w-5 shrink-0" />
        Resell my investment
      </button>
    </div>
  );
}
