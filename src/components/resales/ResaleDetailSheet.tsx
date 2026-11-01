import { RiBuildingLine, RiInformationLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MODEL_BADGE } from '@/components/investment/modelBadge';
import { useResaleDetail, useCancelResale, useDeleteResale } from '@/hooks/useResales';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { ResaleDetail, ResaleStatus } from '@/types';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const PILL = 'text-sm font-medium px-4 py-1 rounded-full min-w-[8rem] text-center';

// Status pill and message per listing state (Figma, Oct 2026)
const STATUS: Record<ResaleStatus, { label: string; pill: string; message?: string; messageClass?: string }> = {
  pending: {
    label: 'Under review',
    pill: 'bg-foreground/10 text-foreground',
    message: 'Your resale listing is currently under review. We will notify you once it has been reviewed and approved for resale.',
    messageClass: 'text-foreground/50',
  },
  approved: {
    label: 'Approved',
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
    message: 'Your resale listing has been approved and is now live in the property hub',
    messageClass: 'text-green-600 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    pill: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  },
  sold: {
    label: 'Approved',
    pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300',
  },
  cancelled: {
    label: 'Cancelled',
    pill: 'bg-foreground/10 text-foreground/60',
  },
};

// The API's status casing and wording vary (e.g. "PENDING", "under_review", "live"), so normalise first
const STATUS_ALIASES: Record<string, ResaleStatus> = {
  under_review: 'pending',
  pending_review: 'pending',
  in_review: 'pending',
  live: 'approved',
  active: 'approved',
  completed: 'sold',
  complete: 'sold',
  declined: 'rejected',
  canceled: 'cancelled',
};

function normaliseStatus(raw: string | undefined): ResaleStatus | undefined {
  const key = (raw ?? '').toLowerCase().replace(/[\s-]+/g, '_');
  return key in STATUS ? (key as ResaleStatus) : STATUS_ALIASES[key];
}

const COMPLETE_PILL = 'bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300';
const RESALE_PILL = 'bg-foreground/10 text-foreground/60';

const unitsLabel = (r: ResaleDetail) =>
  r.quantityLabel?.toLowerCase() ?? `${r.quantity} unit${r.quantity !== 1 ? 's' : ''}`;

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  info,
  valueClass,
}: {
  label: string;
  value: string;
  info?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-foreground/10 last:border-0">
      <span className="flex items-center gap-2 text-sm text-foreground/50 shrink-0">
        {label}
        {info && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`About ${label}`} className="text-foreground">
                <RiInformationLine className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-60">{info}</TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className={cn('text-sm text-foreground text-right', valueClass)}>{value}</span>
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────

function ResaleDetailBody({
  resale,
  onClose,
}: {
  resale: ResaleDetail;
  onClose: () => void;
}) {
  const cancelMutation = useCancelResale();
  const deleteMutation = useDeleteResale();

  const fin = resale.financials;
  const listedDate = resale.listedAt ?? resale.createdAt;
  const statusKey = normaliseStatus(resale.status);
  const status = statusKey
    ? STATUS[statusKey]
    : { label: resale.statusLabel || resale.status || 'Unknown', pill: 'bg-foreground/10 text-foreground/60' };

  // Left pill: the investment model, or "Complete" once sold (falls back to "Resale")
  const leftPill =
    statusKey === 'sold'
      ? { label: 'Complete', cls: COMPLETE_PILL }
      : resale.investmentTypeLabel
        ? { label: resale.investmentTypeLabel, cls: MODEL_BADGE[resale.investmentType ?? ''] ?? RESALE_PILL }
        : { label: 'Resale', cls: RESALE_PILL };

  const stats = [
    { label: 'Listed', value: formatDate(listedDate, { day: 'numeric', month: 'short', year: 'numeric' }), align: 'text-left' },
    { label: 'Quantity', value: unitsLabel(resale), align: 'text-center' },
    ...(fin ? [{ label: 'Amount to be paid', value: formatCurrency(fin.netPayout), align: 'text-right' }] : []),
  ];

  const handleCancel = () => {
    cancelMutation.mutate(resale.id, {
      onSuccess: () => {
        toast.success('Listing cancelled');
        onClose();
      },
      onError: () => toast.error('Failed to cancel listing'),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(resale.id, {
      onSuccess: () => {
        toast.success('Listing deleted');
        onClose();
      },
      onError: () => toast.error('Failed to delete listing'),
    });
  };

  return (
    <div className="space-y-3">
      {/* ── Property card ── */}
      <div className={cn(CARD, 'p-4')}>
        {resale.propertyImageUrl ? (
          <img
            src={resale.propertyImageUrl}
            alt={resale.title}
            className="w-full h-40 object-cover rounded-2xl"
          />
        ) : (
          <div className="w-full h-40 rounded-2xl bg-accent/10 flex items-center justify-center">
            <RiBuildingLine className="h-10 w-10 text-accent" />
          </div>
        )}

        <div className="flex items-center justify-between gap-3 mt-3">
          <span className={cn(PILL, leftPill.cls)}>{leftPill.label}</span>
          <span className={cn(PILL, status.pill)}>{status.label}</span>
        </div>

        <div
          className={cn(
            'grid divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl py-2.5',
            stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
          )}
        >
          {stats.map(({ label, value, align }) => (
            <div key={label} className={cn('px-3 min-w-0', align)}>
              <p className="text-foreground/50 text-xs truncate">{label}</p>
              <p className="text-foreground font-bold text-sm mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>

        {statusKey === 'rejected' ? (
          <div className="text-center text-red-600 dark:text-red-400 text-xs mt-3 leading-relaxed">
            <p className="uppercase">Reason:</p>
            <p className="mt-1">
              {resale.rejectionReason ||
                'Your resale listing was not approved. Please review the feedback and make the necessary changes before resubmitting.'}
            </p>
          </div>
        ) : (
          status.message && (
            <p className={cn('text-center text-xs mt-3 leading-relaxed', status.messageClass)}>{status.message}</p>
          )
        )}
      </div>

      {/* ── Listing details ── */}
      <div className={cn(CARD, 'p-4')}>
        <h2 className="text-foreground font-bold text-xl mb-1">Listing details</h2>
        <DetailRow label="Reference" value={resale.reference} />
        {resale.investmentTypeLabel && <DetailRow label="Investment type" value={resale.investmentTypeLabel} />}
        <DetailRow label="Quantity" value={unitsLabel(resale)} />
        <DetailRow
          label="Price range"
          value={`${formatCurrency(resale.minPricePerUnit)} - ${formatCurrency(resale.maxPricePerUnit)}`}
        />
        {fin && (
          <>
            <DetailRow label="Amount sold" value={formatCurrency(fin.grossAmount)} />
            <DetailRow
              label={fin.listingFeeRate != null ? `Listing fee (${(fin.listingFeeRate * 100).toFixed(1)}%)` : 'Listing fee'}
              value={formatCurrency(fin.listingFee)}
              info="Charged by NeedHomes for listing your holding on the Property Hub."
            />
            <DetailRow
              label={
                fin.processingFeeRate != null
                  ? `Processing fee (${(fin.processingFeeRate * 100).toFixed(1)}%)`
                  : 'Processing fee'
              }
              value={formatCurrency(fin.processingFee)}
              info="Charged by NeedHomes on a successful resale."
            />
            <DetailRow
              label="Amount to be paid"
              value={formatCurrency(fin.netPayout)}
              valueClass="font-bold text-green-600 dark:text-green-400"
            />
          </>
        )}
      </div>

      {/* ── Actions ── */}
      {statusKey === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl font-semibold"
            onClick={handleCancel}
            disabled={cancelMutation.isPending || deleteMutation.isPending}
          >
            Cancel listing
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-xl font-semibold"
            onClick={handleDelete}
            disabled={cancelMutation.isPending || deleteMutation.isPending}
          >
            Delete listing
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Sheet wrapper ─────────────────────────────────────────────────────────────

interface ResaleDetailSheetProps {
  resaleId: string | null;
  onClose: () => void;
}

export function ResaleDetailSheet({ resaleId, onClose }: ResaleDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { resale, isLoading } = useResaleDetail(resaleId ?? undefined);

  const body = (
    <TooltipProvider delayDuration={150}>
      {/* Header: centred title; the modal's own close button sits top-right */}
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">Resale Property Details</DialogTitle>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-96 w-full rounded-3xl" />
          </div>
        ) : resale ? (
          <ResaleDetailBody resale={resale} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-foreground/40 text-sm">Could not load listing details.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );

  // Same shell as the performance and payments sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={!!resaleId} onOpenChange={(open) => !open && onClose()}>
      {isMobile ? (
        <SheetContent
          side="bottom"
          className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl"
        >
          {body}
        </SheetContent>
      ) : (
        <DialogContent className="p-0 flex flex-col overflow-hidden gap-0 bg-background max-w-[480px] max-h-[90vh] rounded-3xl">
          {body}
        </DialogContent>
      )}
    </Dialog>
  );
}
