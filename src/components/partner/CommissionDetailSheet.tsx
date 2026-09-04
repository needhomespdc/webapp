import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiInformationLine, RiArrowDownLine } from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionEntry } from '@/hooks/usePartner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { CommissionEntry } from '@/types';

interface CommissionDetailSheetProps {
  entryId: string | null;
  initialEntry?: CommissionEntry;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  completed:  'text-emerald-500',
  pending:    'text-amber-500',
  processing: 'text-amber-500',
  failed:     'text-red-500',
};

const STATUS_LABEL: Record<string, string> = {
  completed:  'Completed',
  pending:    'Pending',
  processing: 'Processing',
  failed:     'Failed',
};

export function CommissionDetailSheet({ entryId, initialEntry, onClose }: CommissionDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const { entry: fetchedEntry, isLoading } = useCommissionEntry(entryId);

  // Show initialEntry immediately; fetchedEntry takes over once loaded
  const entry = fetchedEntry ?? initialEntry;
  const showSkeleton = isLoading && !entry;

  const isPayout = entry?.type === 'payout';
  const statusLabel = entry ? (STATUS_LABEL[entry.status] ?? entry.status) : '';
  const statusCls   = entry ? (STATUS_COLOR[entry.status] ?? 'text-foreground/60') : '';

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-foreground/10 shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">
            Commission Details
          </SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
        {showSkeleton || !entry ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* ── Hero ──────────────────────────────────────────────────── */}
            <div className="flex flex-col items-center text-center py-4 gap-2">
              {entry.propertyImageUrl ? (
                <img
                  src={entry.propertyImageUrl}
                  alt={entry.propertyTitle}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  isPayout ? 'bg-red-500/15' : 'bg-accent/15'
                )}>
                  {isPayout
                    ? <RiArrowDownLine className="h-9 w-9 text-red-400" />
                    : <HiBuildingOffice2 className="h-9 w-9 text-accent" />
                  }
                </div>
              )}

              <div>
                <p className="text-base font-semibold text-foreground">{entry.propertyTitle}</p>
                <div className="flex items-center flex-wrap justify-center gap-2 mt-1">
                  {entry.subtitle && (
                    <p className="text-sm text-foreground/50 max-w-xs">{entry.subtitle}</p>
                  )}
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    isPayout ? 'bg-red-500/15 text-red-400' : 'bg-accent/15 text-accent'
                  )}>
                    {isPayout ? 'Payout' : 'Earned'}
                  </span>
                </div>
              </div>

              <p className={cn('text-2xl font-bold mt-1', isPayout ? 'text-red-400' : 'text-green-400')}>
                {isPayout ? '-' : '+'}{formatCurrency(entry.amount)}
              </p>
              <p className="text-sm text-foreground/50">
                {formatDate(entry.occurredAt, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* ── Detail rows ───────────────────────────────────────────── */}
            <div className="bg-foreground/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-foreground/10">
                <p className="text-sm font-semibold text-foreground">Transaction Details</p>
              </div>
              <div className="divide-y divide-foreground/10">
                <DetailRow label="Reference" value={entry.reference} />
                <DetailRow label="Property" value={entry.propertyTitle} />
                {entry.location && (
                  <DetailRow label="Location" value={entry.location} />
                )}
                {entry.investorName && (
                  <DetailRow label="Referral Lead" value={entry.investorName} />
                )}
                {entry.investmentAmount != null && (
                  <DetailRow label="Investment Amount" value={formatCurrency(entry.investmentAmount)} />
                )}
                {entry.commissionRate != null && (
                  <DetailRow label="Commission Rate" value={formatPercent(entry.commissionRate)} />
                )}
                <DetailRow
                  label="Commission Amount"
                  value={`${isPayout ? '-' : '+'}${formatCurrency(entry.amount)}`}
                  valueClass={cn('font-semibold', isPayout ? 'text-red-400' : 'text-accent')}
                />
                {entry.feeAmount > 0 && (
                  <DetailRow label="Fee" value={`-${formatCurrency(entry.feeAmount)}`} valueClass="text-foreground/60" />
                )}
                {entry.processingFee != null && entry.processingFee > 0 && (
                  <DetailRow label="Processing Fee" value={`-${formatCurrency(entry.processingFee)}`} valueClass="text-foreground/60" />
                )}
                {entry.leadSource && (
                  <DetailRow label="Lead Source" value={entry.leadSource} />
                )}
                <DetailRow
                  label="Date & Time"
                  value={formatDate(entry.occurredAt, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                />
                {entry.processedAt && entry.processedAt !== entry.occurredAt && (
                  <DetailRow
                    label="Processed At"
                    value={formatDate(entry.processedAt, {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  />
                )}
                <DetailRow label="Status" value={statusLabel} valueClass={cn('font-semibold', statusCls)} />
              </div>
            </div>

            {/* ── Need Help ─────────────────────────────────────────────── */}
            <button
              onClick={() => { onClose(); navigate('/partner/support'); }}
              className="w-full flex items-center gap-3 bg-foreground/5 rounded-xl p-4 text-left hover:bg-foreground/10 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                <RiInformationLine className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Need Help?</p>
                <p className="text-xs text-foreground/50 mt-0.5">
                  If you have any issues with this transaction, please contact our support team.
                </p>
              </div>
              <RiArrowRightLine className="text-foreground/30 shrink-0" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!!entryId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[90vh] flex flex-col overflow-hidden">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={!!entryId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Commission Details</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start justify-between px-4 py-3 gap-3">
      <span className="text-sm text-foreground/50 shrink-0">{label}</span>
      <span className={cn('text-sm text-right font-medium break-all', valueClass ?? 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}
