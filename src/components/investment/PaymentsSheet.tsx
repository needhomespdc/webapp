// import { useNavigate } from 'react-router-dom';
import {
  RiCheckLine,
  RiDownload2Line,
  RiInformationLine,
  // RiQuestionLine,
  RiBuildingLine,
  RiMapPinLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useInvestmentPayments } from '@/hooks/useInvestment';
import { investmentsApi } from '@/api/investments.api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { Investment } from '@/types';

const MODEL_BADGE: Record<string, string> = {
  co_development: 'bg-emerald-500',
  fractional: 'bg-violet-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  outright: 'bg-amber-500',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  paid: { label: 'Paid', cls: 'text-green-400 bg-green-500/15' },
  completed: { label: 'Paid', cls: 'text-green-400 bg-green-500/15' },
  pending: { label: 'Pending', cls: 'text-amber-400 bg-amber-500/15' },
  overdue: { label: 'Overdue', cls: 'text-red-400 bg-red-500/15' },
  failed: { label: 'Failed', cls: 'text-red-400 bg-red-500/15' },
};

interface Props {
  inv: Investment;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentsSheet({ inv, isOpen, onClose }: Props) {
  // const navigate = useNavigate();
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const { paymentEntries } = useInvestmentPayments(isOpen ? inv.id : undefined);

  const downloadReceipt = async () => {
    try {
      const blob = await investmentsApi.getReceipt(inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${inv.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download receipt');
    }
  };

  const totalPaid = inv.totalInvested ?? 0;
  const totalUnpaid = Math.max(0, (inv.totalCommitment ?? 0) - totalPaid);
  const planType = inv.paymentPlan ?? 'Full Payment';

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

  const paidEntries = displayEntries.filter(
    (e) => e.status === 'paid' || e.status === 'completed'
  );

  const aboutText =
    inv.type === 'save_to_own'
      ? `Your Save-to-Own plan is in progress. Your next payment is due on ${inv.nextPaymentDate ? formatDate(inv.nextPaymentDate) : 'the scheduled date'}.`
      : totalUnpaid === 0
        ? 'Your payment plan has been fully paid. Tap View Receipt to download your payment receipt.'
        : 'You have an outstanding balance. Complete your payment to secure your investment.';

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden gap-0',
          isMobile ? 'h-[88vh] rounded-t-3xl' : 'w-[480px] sm:max-w-[480px]'
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-foreground/10 shrink-0 pr-12">
          <SheetTitle className="flex-1 text-base font-bold">My Payments</SheetTitle>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Investment summary */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0">
                {inv.propertyImageUrl ? (
                  <img src={inv.propertyImageUrl} alt={inv.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-accent/10 flex items-center justify-center">
                    <RiBuildingLine className="text-accent h-5 w-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-bold text-sm truncate mb-1">{inv.title}</p>
                <span
                  className={cn(
                    'text-white text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    MODEL_BADGE[inv.type] ?? 'bg-foreground/30'
                  )}
                >
                  {inv.typeLabel}
                </span>
                <div className="flex items-center gap-1 mt-1.5 text-foreground/50 text-xs">
                  <RiMapPinLine className="h-3 w-3 shrink-0" />
                  {inv.location}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-foreground/8">
              <div>
                <p className="text-foreground/40 text-[10px]">Your Ownership</p>
                <p className="text-foreground text-xs font-bold mt-0.5">{inv.unitsOwnedLabel}</p>
              </div>
              <div className="w-px h-6 bg-foreground/10" />
              <div>
                <p className="text-foreground/40 text-[10px]">Investment Date</p>
                <p className="text-foreground text-xs font-bold mt-0.5">{formatDate(inv.startedAt)}</p>
              </div>
            </div>
          </div>

          {/* Payment Plan */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
            <h2 className="text-foreground font-bold text-sm mb-3">Payment Plan</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Plan Type', value: planType },
                { label: 'Payment Date', value: formatDate(inv.startedAt) },
                { label: 'Payment Method', value: 'Wallet' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-foreground/40 text-[10px]">{label}</p>
                  <p className="text-foreground text-xs font-semibold mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-foreground/10">
              <h2 className="text-foreground font-bold text-sm">Payment Breakdown</h2>
            </div>
            {displayEntries.map((entry, i) => {
              const isPaid = entry.status === 'paid' || entry.status === 'completed';
              const s = STATUS_CONFIG[entry.status] ?? STATUS_CONFIG.pending;
              return (
                <div
                  key={entry.id}
                  className={cn(
                    'px-4 py-3',
                    i < displayEntries.length - 1 && 'border-b border-foreground/8'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold">
                        {entry.label ?? `Payment ${i + 1}`} — {formatCurrency(entry.amount)}
                      </p>
                      {(entry.paidAt ?? entry.dueDate) && (
                        <p className="text-foreground/40 text-xs mt-0.5">
                          {formatDate((entry.paidAt ?? entry.dueDate)!)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', s.cls)}>
                        {s.label}
                      </span>
                      {isPaid && (
                        <button
                          onClick={downloadReceipt}
                          className="text-accent text-xs font-semibold flex items-center gap-1"
                        >
                          View Receipt <RiDownload2Line className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="px-4 py-3 border-t border-foreground/10 space-y-2 bg-foreground/3">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Total Paid</span>
                <span className="text-green-400 font-bold text-sm">{formatCurrency(totalPaid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60 text-sm">Total Unpaid</span>
                <span className="text-foreground font-bold text-sm">{formatCurrency(totalUnpaid)}</span>
              </div>
            </div>
          </div>

          {/* Payment History */}
          {paidEntries.length > 0 && (
            <div>
              <h2 className="text-foreground font-bold text-sm mb-3">Payment History</h2>
              <div className="space-y-2">
                {paidEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center shrink-0">
                      <RiCheckLine className="h-4 w-4 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-semibold">{entry.label ?? 'Payment'}</p>
                      <p className="text-foreground/40 text-xs mt-0.5">
                        Payment completed{entry.paidAt ? ` | ${formatDate(entry.paidAt)}` : ''}
                      </p>
                    </div>
                    <p className="text-green-400 font-bold text-sm shrink-0">{formatCurrency(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Your Payments */}
          <div className="flex items-start gap-3 bg-primary/20 border border-primary/30 rounded-2xl px-4 py-4">
            <div className="w-9 h-9 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
              <RiInformationLine className="h-4 w-4 text-blue-300" />
            </div>
            <div>
              <p className="text-foreground font-semibold text-sm mb-1">About Your Payments</p>
              <p className="text-foreground/60 text-xs leading-relaxed">{aboutText}</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
