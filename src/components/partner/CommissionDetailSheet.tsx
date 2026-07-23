import { useNavigate } from 'react-router-dom';
import { RiArrowRightLine, RiInformationLine } from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionEntry } from '@/hooks/usePartner';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CommissionDetailSheetProps {
  entryId: string | null;
  onClose: () => void;
}

export function CommissionDetailSheet({ entryId, onClose }: CommissionDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const { entry, isLoading } = useCommissionEntry(entryId);

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
        {isLoading || !entry ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-48" />
            </div>
            <Skeleton className="h-52 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="flex flex-col items-center text-center py-4 gap-2">
              {entry.propertyImageUrl ? (
                <img
                  src={entry.propertyImageUrl}
                  alt={entry.propertyTitle}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <HiBuildingOffice2 className="h-9 w-9" />
                </div>
              )}

              <div>
                <p className="text-base font-semibold text-foreground">{entry.propertyTitle}</p>
                <div className="flex items-center flex-wrap justify-center gap-2 mt-1">
                  {entry.location && (
                    <p className="text-sm text-foreground/50">{entry.location}</p>
                  )}
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    entry.status === 'completed'
                      ? 'bg-green-600/15 text-green-400'
                      : entry.status === 'pending' || entry.status === 'processing'
                      ? 'bg-amber-500/15 text-amber-500'
                      : 'bg-foreground/10 text-foreground/60'
                  )}>
                    {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                  </span>
                </div>
              </div>

              <p className="text-2xl font-bold text-green-400 mt-1">
                +{formatCurrency(entry.amount)}
              </p>
              <p className="text-sm text-foreground/50">
                {formatDate(entry.occurredAt, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Detail fields */}
            <div className="bg-foreground/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-foreground/10">
                <p className="text-sm font-semibold text-foreground">Commission Details</p>
              </div>
              <div className="divide-y divide-foreground/10">
                <DetailRow label="Reference ID" value={entry.reference} />
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
                  value={`+${formatCurrency(entry.amount)}`}
                  valueClass="text-accent font-semibold"
                />
                <DetailRow
                  label="Status"
                  value={entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                />
                <DetailRow
                  label="Date"
                  value={formatDate(entry.occurredAt, {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                />
                {entry.leadSource && (
                  <DetailRow label="Lead Source" value={entry.leadSource} />
                )}
              </div>
            </div>

            {/* Need Help */}
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
