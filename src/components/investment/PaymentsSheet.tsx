import { useState } from 'react';
import { RiInformationLine, RiBuildingLine, RiMapPinLine } from 'react-icons/ri';
// Sheet and Dialog share one Radix Dialog root, so a single root can host either content
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useInvestmentPayments } from '@/hooks/useInvestment';
import { investmentsApi } from '@/api/investments.api';
import { formatCurrency, formatDate, cn, percentOwned, openFileInNewTab } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Investment } from '@/types';
import { Button } from '@/components/ui/button';
import { MODEL_BADGE } from './modelBadge';
import { MakePaymentFlow } from './MakePaymentFlow';

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  paid: {
    label: 'Paid',
    cls: 'text-green-600 bg-green-500/15 dark:text-green-400',
  },
  completed: {
    label: 'Paid',
    cls: 'text-green-600 bg-green-500/15 dark:text-green-400',
  },
  pending: {
    label: 'Pending',
    cls: 'text-amber-600 bg-amber-500/15 dark:text-amber-400',
  },
  overdue: {
    label: 'Overdue',
    cls: 'text-red-600 bg-red-500/15 dark:text-red-400',
  },
  failed: {
    label: 'Failed',
    cls: 'text-red-600 bg-red-500/15 dark:text-red-400',
  },
  // Instalment states from the co-development design (Oct 2026)
  partially_paid: {
    label: 'Unpaid balance',
    cls: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15',
  },
  due: {
    label: 'Due',
    cls: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/15',
  },
  unpaid: {
    label: 'Unpaid',
    cls: 'text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15',
  },
};

const STATUS_ALIASES: Record<string, string> = {
  partial: 'partially_paid',
  partially_paid: 'partially_paid',
  unpaid_balance: 'partially_paid',
  upcoming: 'unpaid',
  scheduled: 'unpaid',
};

const isPaidStatus = (status: string) => ['paid', 'completed'].includes(status.toLowerCase());

/** Status key for one schedule entry; a part-paid entry counts as "Unpaid balance" */
function entryStatus(e: { status: string; paidAmount?: number; balanceDue?: number }, instalmentStyle: boolean): string {
  const k = e.status.toLowerCase().replace(/[\s-]+/g, '_');
  if (isPaidStatus(k)) return 'paid';
  if ((e.paidAmount ?? 0) > 0 && (e.balanceDue ?? 1) > 0) return 'partially_paid';
  if (STATUS_ALIASES[k]) return STATUS_ALIASES[k];
  if (instalmentStyle && k === 'pending') return 'unpaid';
  if (instalmentStyle && k === 'overdue') return 'due';
  return k;
}

const entryLabel = (e: { label?: string; description?: string }, i: number, numbered = false) =>
  e.label ??
  (e as { title?: string }).title ??
  e.description ??
  (numbered ? `Payment ${i + 1}` : i === 0 ? 'Initial Payment' : `Instalment ${i}`);

const CARD = 'bg-card border border-foreground/5 rounded-3xl';

interface Props {
  inv: Investment;
  isOpen: boolean;
  onClose: () => void;
  /** Open straight into the pay flow (save-to-own "Save Now") */
  startPaying?: boolean;
}

export function PaymentsSheet({ inv, isOpen, onClose, startPaying }: Props) {
  // Same mobile breakpoint and hook as every other sheet (also updates when the window resizes)
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { paymentEntries } = useInvestmentPayments(isOpen ? inv.id : undefined);
  const [paying, setPaying] = useState(false);
  // "Save Now" opens the sheet already in the pay flow
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen && startPaying) setPaying(true);
  }

  const close = () => {
    setPaying(false);
    onClose();
  };

  const downloadReceipt = async () => {
    try {
      await openFileInNewTab(() => investmentsApi.getReceipt(inv.id), `receipt-${inv.reference}.pdf`);
    } catch {
      toast.error('Failed to open receipt');
    }
  };

  const totalPaid = inv.totalInvested ?? 0;
  const totalUnpaid = Math.max(0, (inv.totalCommitment ?? 0) - totalPaid);
  const planType = inv.paymentPlan ?? 'Full Payment';
  // Co-development design (Oct 2026): plan sits in the summary, then straight to history;
  // the breakdown only shows while something is still owed
  const isCoDev = inv.type === 'co_development';
  const isLandBanking = inv.type === 'land_banking';
  // Save-to-own design (Oct 2026): titled Payment History, three-stat summary, schedule with totals, Pay Now
  const isSaveToOwn = inv.type === 'save_to_own';
  // Outright is paid in one go, so its design drops the breakdown and goes straight to history;
  // fully paid co-development and land banking plans do the same
  const showBreakdown = inv.type !== 'outright' && (!(isCoDev || isLandBanking) || totalUnpaid > 0);

  const displayEntries =
    paymentEntries.length > 0
      ? paymentEntries
      : [
          {
            id: 'initial',
            label: 'Initial payment',
            amount: totalPaid,
            status: totalPaid > 0 ? 'paid' : 'pending',
            paidAt: inv.startedAt,
          },
          ...(totalUnpaid > 0
            ? [
                {
                  id: 'remaining',
                  label: inv.remainingInstallmentsLabel ?? 'Remaining balance',
                  amount: totalUnpaid,
                  status: 'pending',
                  paidAt: undefined,
                },
              ]
            : []),
        ];

  const paidEntries = displayEntries.filter((e) => isPaidStatus(e.status));
  // Next instalment still owed: what "Make payment" suggests first
  const nextDue = displayEntries.find((e) => !isPaidStatus(e.status));
  const suggestedAmount = nextDue ? (nextDue.balanceDue ?? nextDue.amount) : totalUnpaid;
  // Co-development and land banking designs (Oct 2026): instalment pills, receipts in the breakdown, pay button
  const instalmentStyle = isCoDev || isLandBanking || isSaveToOwn;
  const canPay = instalmentStyle && totalUnpaid > 0;
  const ownershipPct = `${percentOwned(inv)}%`;

  const aboutText =
    inv.type === 'save_to_own'
      ? `Your Save-to-Own plan is in progress. Your next payment is due on ${inv.nextPaymentDate ? formatDate(inv.nextPaymentDate) : 'the scheduled date'}.`
      : totalUnpaid === 0
        ? 'Your payment plan has been fully paid. Tap View Receipt to download your payment receipt.'
        : 'You have an outstanding balance. Complete your payment to secure your investment.';

  const body = (
    <>
      {/* Header: centred title; the modal's own close button sits top-right */}
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">
          {isSaveToOwn ? 'Payment History' : 'Payment Details'}
        </DialogTitle>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Investment summary */}
        <div className={cn(CARD, 'p-4')}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
              {inv.propertyImageUrl ? (
                <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                  <RiBuildingLine className="text-accent h-6 w-6" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-bold text-xl leading-tight truncate">{inv.title}</p>
              <span
                className={cn(
                  'inline-block mt-1.5 text-xs font-medium px-4 py-1 rounded-full',
                  MODEL_BADGE[inv.type] ?? 'bg-foreground/10 text-foreground/70',
                )}
              >
                {inv.typeLabel}
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
                <RiMapPinLine className="h-4 w-4 shrink-0" />
                <span className="truncate">{inv.location}</span>
              </div>
            </div>
          </div>
          {isCoDev || isSaveToOwn ? (
            <div className="grid grid-cols-3 divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl py-2.5">
              {[
                {
                  label: 'Your Ownership',
                  value: isSaveToOwn ? ownershipPct : (inv.ownershipLabel ?? inv.unitsOwnedLabel),
                },
                { label: 'Payment Plan', value: planType },
                { label: isSaveToOwn ? 'Started On' : 'Investment Date', value: formatDate(inv.startedAt) },
              ].map(({ label, value }) => (
                <div key={label} className="px-3 min-w-0">
                  <p className="text-foreground/50 text-xs truncate">{label}</p>
                  <p className="text-foreground text-sm font-bold mt-1 truncate">{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 mt-3 bg-foreground/5 rounded-2xl px-3 py-2.5">
              <div>
                <p className="text-foreground/50 text-xs">Your Ownership</p>
                <p className="text-foreground text-sm font-bold mt-1">{inv.unitsOwnedLabel}</p>
              </div>
              <div className="w-px h-8 bg-foreground/10" />
              <div className="text-right">
                <p className="text-foreground/50 text-xs">Investment Date</p>
                <p className="text-foreground text-sm font-bold mt-1">{formatDate(inv.startedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Plan */}
        {!isCoDev && !isSaveToOwn && (
          <div className={cn(CARD, 'p-4')}>
            <h2 className="text-foreground font-bold text-sm mb-3">Payment Plan</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Plan Type', value: planType },
                { label: 'Payment Date', value: formatDate(inv.startedAt) },
                { label: 'Payment Method', value: 'Wallet' },
              ].map(({ label, value }) => (
                <div key={label} className="min-w-0">
                  <p className="text-foreground/50 text-xs">{label}</p>
                  <p className="text-foreground text-sm font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Breakdown (instalment plans only) */}
        {showBreakdown && (
          <div className={cn(CARD, 'overflow-hidden')}>
            <div className="px-4 py-3 border-b border-foreground/10">
              <h2 className="text-foreground font-bold text-sm">
                {isSaveToOwn ? 'Payment History' : 'Payment Breakdown'}
              </h2>
            </div>
            {displayEntries.map((entry, i) => {
              const isPaid = isPaidStatus(entry.status);
              const s = STATUS_CONFIG[entryStatus(entry, instalmentStyle)] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={entry.id}
                  className={cn('px-4 py-3', i < displayEntries.length - 1 && 'border-b border-foreground/8')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {entryLabel(entry, i, isSaveToOwn)} - {formatCurrency(entry.amount)}
                      </p>
                      {(entry.paidAt ?? entry.dueDate) && (
                        <p className="text-foreground/50 text-xs mt-0.5">
                          {formatDate((entry.paidAt ?? entry.dueDate)!)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'font-medium rounded-full',
                          instalmentStyle ? 'text-xs px-4 py-1' : 'text-[10px] font-semibold px-2 py-0.5',
                          s.cls,
                        )}
                      >
                        {s.label}
                      </span>
                      {isPaid && (
                        <button onClick={downloadReceipt} className="text-accent text-xs font-semibold">
                          View Receipt
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-4 py-3 border-t border-foreground/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Total Paid</span>
                <span className="text-green-600 dark:text-green-400 font-bold text-sm">
                  {formatCurrency(totalPaid)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Total Unpaid</span>
                <span className="text-foreground font-bold text-sm">{formatCurrency(totalUnpaid)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment History (co-development instalments show receipts in the breakdown instead) */}
        {paidEntries.length > 0 && !(instalmentStyle && showBreakdown) && (
          <div className={cn(CARD, 'px-4 pt-4')}>
            <h2 className="text-foreground font-bold text-sm pb-3 border-b border-foreground/10">Payment History</h2>
            {paidEntries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-start justify-between gap-3 py-3',
                  i < paidEntries.length - 1 && 'border-b border-foreground/8',
                )}
              >
                <div className="min-w-0">
                  <p className="text-foreground text-sm font-bold">{entry.label ?? 'Payment'}</p>
                  <p className="text-foreground/50 text-xs mt-1">
                    Payment completed
                    {entry.paidAt && (
                      <>
                        <span className="mx-1.5 text-foreground/25">•</span>
                        {formatDate(entry.paidAt)}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <p className="text-green-600 dark:text-green-400 font-bold text-sm">{formatCurrency(entry.amount)}</p>
                  <button onClick={downloadReceipt} className="text-accent text-xs font-semibold">
                    View Receipt
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* About Your Payments */}
        {canPay && isCoDev && (
          <div className="bg-blue-100 dark:bg-blue-500/15 rounded-3xl p-4">
            <div className="flex items-center gap-3">
              <RiInformationLine className="h-5 w-5 text-blue-900 dark:text-blue-300 shrink-0" />
              <p className="text-blue-900 dark:text-blue-300 font-bold text-sm">About Your Payments</p>
            </div>
            <p className="text-foreground/50 text-xs leading-relaxed mt-3">
              Pay any amount toward your outstanding balance. Payments are applied to instalments in order.
            </p>
          </div>
        )}
        {!isCoDev && !isSaveToOwn && (
          <div className="bg-foreground/[0.07] rounded-3xl px-4 py-4">
            <div className="flex items-center gap-3 mb-2">
              <RiInformationLine className="h-5 w-5 text-foreground shrink-0" />
              <p className="text-foreground font-bold text-sm">About Your Payments</p>
            </div>
            <p className="text-foreground/60 text-xs leading-relaxed">{aboutText}</p>
          </div>
        )}
      </div>

      {canPay && (
        <div className="bg-card px-4 pt-4 pb-5 shrink-0">
          <Button
            className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
            onClick={() => setPaying(true)}
          >
            {isCoDev ? 'Make payment' : 'Pay Now'}
          </Button>
        </div>
      )}
    </>
  );

  const content = paying ? (
    <MakePaymentFlow
      inv={inv}
      outstanding={totalUnpaid}
      suggested={suggestedAmount}
      onExit={() => setPaying(false)}
    />
  ) : (
    body
  );

  // New design: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl"
        >
          {content}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] max-h-[90vh] rounded-3xl">
          {content}
        </DialogContent>
      )}
    </Dialog>
  );
}
