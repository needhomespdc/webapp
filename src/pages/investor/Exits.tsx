import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiInformationLine,
  RiLogoutCircleRLine,
  RiTimeLine,
  RiAddLine,
  RiBook2Line,
  RiBuildingLine,
} from 'react-icons/ri';
import { useEligibleExits, useExitList, useCreateExit } from '@/hooks/useExits';
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
import type { ExitRequest, EligibleInvestment } from '@/types';

// ─── Stepper ──────────────────────────────────────────────────────────────────

type Step = 'select' | 'review' | 'confirm';

const STEPS: { key: Step; label: string }[] = [
  { key: 'select', label: 'Select Investment' },
  { key: 'review', label: 'Review Payout' },
  { key: 'confirm', label: 'Confirm' },
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
                <div className={cn('flex-1 h-0.5', i < currentIdx ? 'bg-accent' : 'bg-foreground/15')} />
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
              <p className={cn('w-8 text-center text-[10px] leading-tight shrink-0', completed || active ? 'text-accent font-medium' : 'text-foreground/30')}>
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

// ─── Investment selection card ─────────────────────────────────────────────────

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
          {inv.propertyImageUrl
            ? <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><RiBuildingLine className="h-6 w-6 text-foreground/30" /></div>
          }
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

// ─── Exit request sheet ────────────────────────────────────────────────────────

interface ExitRequestSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eligible: EligibleInvestment[];
  eligibleLoading: boolean;
}

function ExitRequestSheet({ open, onOpenChange, eligible, eligibleLoading }: ExitRequestSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [step, setStep] = useState<Step>('select');
  const [selectedInv, setSelectedInv] = useState<EligibleInvestment | null>(null);
  const [agreed, setAgreed] = useState(false);
  const createMutation = useCreateExit();

  const reset = () => {
    setStep('select');
    setSelectedInv(null);
    setAgreed(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleBack = () => {
    if (step === 'review') setStep('select');
    else handleClose(false);
  };

  const handleSubmit = () => {
    if (!selectedInv || !agreed) { toast.error('Please accept the exit terms'); return; }
    createMutation.mutate(
      { investmentId: selectedInv.investmentId, termsAccepted: true },
      {
        onSuccess: () => {
          toast.success('Exit request submitted successfully');
          handleClose(false);
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to submit exit request'),
      },
    );
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <SheetTitle className="sr-only">Exit Investment</SheetTitle>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/10 shrink-0 pr-14">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <p className="flex-1 text-foreground font-bold text-sm text-center">Exit Investment</p>
      </div>

      <Stepper step={step} />

      {/* ── STEP 1: Select ── */}
      {step === 'select' && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-3">
            <div>
              <p className="text-foreground font-bold text-base">Select Investment to Exit</p>
              <p className="text-foreground/50 text-xs mt-0.5">Choose a fully paid investment you would like to exit.</p>
            </div>

            {eligibleLoading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
            ) : !eligible.length ? (
              <EmptyState
                icon={<RiLogoutCircleRLine />}
                title="No eligible investments"
                description="Investments become eligible for exit after a minimum holding period."
              />
            ) : (
              <div className="space-y-3">
                {eligible.map((inv) => (
                  <InvCard key={inv.investmentId} inv={inv} selected={selectedInv?.investmentId === inv.investmentId} onSelect={() => setSelectedInv(inv)} />
                ))}
              </div>
            )}

            {/* Eligibility note */}
            <div className="bg-accent/10 border border-accent/25 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                <RiInformationLine className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">Eligibility for Exit</p>
                <p className="text-foreground/60 text-xs mt-1 leading-relaxed">
                  You can request to exit land banking and fractional investments that are fully paid. Exit requests are reviewed by our team and payouts are subject to buyer availability and market conditions.
                </p>
              </div>
            </div>
          </div>

          <div className="px-4 pb-4 pt-3 border-t border-foreground/10 shrink-0">
            <Button
              className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-base flex items-center justify-center gap-2"
              onClick={() => {
                if (!selectedInv) { toast.error('Please select an investment'); return; }
                setStep('review');
              }}
              disabled={!selectedInv}
            >
              Continue to Review
              <span className="text-lg">›</span>
            </Button>
          </div>
        </>
      )}

      {/* ── STEP 2: Review Payout ── */}
      {step === 'review' && selectedInv && (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 space-y-5">
            <div>
              <p className="text-foreground font-bold text-base">Review Your Exit Request</p>
              <p className="text-foreground/50 text-xs mt-0.5">Please review the payout estimate before submitting your exit request.</p>
            </div>

            <InvCard inv={selectedInv} />

            {/* Payout summary */}
            <div>
              <p className="text-foreground font-bold text-sm mb-3">Payout Summary</p>
              <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Current Value</span>
                  <span className="text-foreground font-medium">{formatCurrency(selectedInv.currentValue)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Amount Invested</span>
                  <span className="text-foreground font-medium">{formatCurrency(selectedInv.investedAmount)}</span>
                </div>
                <div className="border-t border-dashed border-foreground/15 pt-3 flex items-center justify-between text-sm">
                  <span className="text-foreground/60">Exit Fee</span>
                  <span className="text-foreground/40 text-xs">Calculated on approval</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-semibold text-sm">Estimated Payout</span>
                  <span className="text-accent font-bold text-base">{formatCurrency(selectedInv.currentValue)}</span>
                </div>
              </div>
            </div>

            {/* Disclaimer note */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-start gap-3">
              <RiInformationLine className="text-foreground/40 h-4 w-4 mt-0.5 shrink-0" />
              <p className="text-foreground/50 text-xs leading-relaxed">
                Your exit request will be reviewed within 1–2 business days. The estimated payout is based on current valuation and may change before completion after exit fees are applied.
              </p>
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
                I understand that exit fees will be deducted and the final payout is subject to review and market conditions.
              </span>
            </label>
          </div>

          <div className="px-4 pb-4 pt-3 border-t border-foreground/10 shrink-0 space-y-2">
            <Button
              className="w-full h-13 bg-accent hover:bg-accent/90 text-white font-bold rounded-2xl text-base"
              onClick={handleSubmit}
              disabled={!agreed || createMutation.isPending}
            >
              {createMutation.isPending ? 'Submitting…' : 'Confirm Exit Request'}
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
        className={cn('p-0 flex flex-col overflow-hidden', isMobile ? 'rounded-t-2xl h-[92vh]' : 'h-full sm:max-w-md')}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}

// ─── Exit card ─────────────────────────────────────────────────────────────────

function ExitCard({ exit }: { exit: ExitRequest }) {
  const isCompleted = exit.status === 'completed';
  const isPending = exit.status === 'pending';

  const col1Label = isCompleted ? 'Exited On' : 'Requested On';
  const col2Label = isCompleted ? 'Shares Exited' : 'Shares to Exit';
  const col3Label = isCompleted ? 'Amount Received' : 'Est. Payout';
  const col3Value = exit.finalPayout > 0 ? formatCurrency(exit.finalPayout) : formatCurrency(exit.principalAmount);

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
          {exit.investment?.propertyImageUrl
            ? <img src={exit.investment.propertyImageUrl} alt={exit.investment.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><RiBuildingLine className="h-6 w-6 text-foreground/30" /></div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-sm line-clamp-1">{exit.investment?.title ?? 'Investment'}</p>
          <p className="text-foreground/50 text-xs mt-0.5">{exit.investment?.location ?? '—'}</p>
        </div>
        <StatusBadge status={exit.status} />
      </div>

      {/* 3-col grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-foreground/40">{col1Label}</p>
          <p className="text-foreground font-medium mt-0.5">{formatDate(exit.createdAt)}</p>
        </div>
        <div>
          <p className="text-foreground/40">{col2Label}</p>
          <p className="text-foreground font-medium mt-0.5">{exit.investment?.unitsOwnedLabel ?? '—'}</p>
        </div>
        <div>
          <p className="text-foreground/40">{col3Label}</p>
          <p className={cn('font-semibold mt-0.5', isCompleted ? 'text-green-400' : 'text-foreground')}>
            {col3Value}
          </p>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex justify-end">
        <div className="w-7 h-7 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/30">
          <RiArrowRightSLine className="h-4 w-4" />
        </div>
      </div>

      {exit.rejectionReason && (
        <p className="text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">{exit.rejectionReason}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<string, string> = { all: 'All Exits', pending: 'Pending', cancelled: 'Cancelled' };

export default function Exits() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const { eligible, isLoading: eligibleLoading } = useEligibleExits();
  const { exits, isLoading } = useExitList('history');

  const totalExits = exits.length;
  const pendingCount = exits.filter((e) => e.status === 'pending').length;

  const filtered = (() => {
    if (tab === 'pending') return exits.filter((e) => e.status === 'pending');
    if (tab === 'cancelled') return exits.filter((e) => e.status === 'cancelled' || e.status === 'rejected');
    return exits.filter((e) => e.status !== 'cancelled' && e.status !== 'rejected');
  })();

  return (
    <div className="space-y-5 sm:pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/investor/exits-and-resales')}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">Exits</h1>
          <p className="text-foreground/50 text-xs mt-0.5">Request to exit your investment or view your exit history.</p>
        </div>
      </div>

      {/* CTA — inline on mobile */}
      <Button
        className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl sm:hidden"
        onClick={() => setSheetOpen(true)}
      >
        <RiAddLine className="h-5 w-5 mr-2" />
        New Exit Request
      </Button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
            <RiLogoutCircleRLine className="text-accent h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Total Exits</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : totalExits}</p>
          </div>
        </div>
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-blue-400 h-5 w-5" />
          </div>
          <div>
            <p className="text-foreground/50 text-xs">Pending Exits</p>
            <p className="text-foreground font-bold text-xl leading-tight">{isLoading ? '—' : pendingCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs — underline style */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full bg-transparent border-0 p-0 rounded-none gap-0 flex border-b border-foreground/10">
          {Object.entries(TAB_LABELS).map(([t, label]) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn(
                'flex-1 rounded-none pb-2.5 pt-1 px-2 bg-transparent shadow-none border-b-2 border-transparent -mb-px',
                'data-[state=active]:border-accent data-[state=active]:text-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none',
                'text-foreground/40 text-sm font-medium',
              )}
            >
              {label}
              {t === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-accent text-white text-[9px] font-bold">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}</div>
          ) : !filtered.length ? (
            <EmptyState icon={<RiBook2Line />} title="No exit requests" description="Your exit history will appear here." />
          ) : (
            <div className="space-y-3">
              {filtered.map((exit) => <ExitCard key={exit.id} exit={exit} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* About Exits */}
      <button className="w-full bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-accent/15 transition-colors">
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
          <RiInformationLine className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">About Exits</p>
          <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">
            Exit requests are subject to availability of buyers and company approval. Payouts are processed after a successful exit.
          </p>
        </div>
        <RiArrowRightLine className="text-foreground/30 h-5 w-5 shrink-0" />
      </button>

      {/* FAB — desktop only */}
      <button
        onClick={() => setSheetOpen(true)}
        className="hidden sm:flex fixed bottom-10 right-8 z-40 items-center gap-2 bg-accent hover:bg-accent/90 text-white font-semibold text-sm px-5 py-3.5 rounded-full shadow-lg shadow-accent/30 transition-all active:scale-95"
      >
        <RiAddLine className="h-5 w-5 shrink-0" />
        New Exit Request
      </button>

      {/* Sheet */}
      <ExitRequestSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        eligible={eligible}
        eligibleLoading={eligibleLoading}
      />
    </div>
  );
}
