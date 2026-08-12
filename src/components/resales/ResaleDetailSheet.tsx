import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiTimeLine,
  RiInformationLine,
  RiBuildingLine,
  RiFileCopyLine,
  RiCloseLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useResaleDetail, useCancelResale, useDeleteResale } from '@/hooks/useResales';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { ResaleDetail } from '@/types';

// ─── Detail row ───────────────────────────────────────────────────────────────

function DetailRow({
  label,
  value,
  valueClass,
  noBorder,
}: {
  label: string;
  value: string;
  valueClass?: string;
  noBorder?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 py-3',
        !noBorder && 'border-b border-foreground/8 last:border-0',
      )}
    >
      <span className="text-xs text-foreground/50 shrink-0 pt-0.5">{label}</span>
      <span className={cn('text-sm font-semibold text-foreground text-right', valueClass)}>
        {value}
      </span>
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

  const priceRangeLabel =
    resale.minPricePerUnit === resale.maxPricePerUnit
      ? `${formatCurrency(resale.minPricePerUnit)} per unit`
      : `${formatCurrency(resale.minPricePerUnit)} – ${formatCurrency(resale.maxPricePerUnit)} per unit`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(resale.reference);
    toast.success('Reference copied');
  };

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
    <div className="space-y-4">

      {/* ── Property card ── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        {resale.propertyImageUrl ? (
          <img
            src={resale.propertyImageUrl}
            alt={resale.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-28 bg-foreground/5 flex items-center justify-center">
            <RiBuildingLine className="h-10 w-10 text-foreground/20" />
          </div>
        )}

        <div className="p-4">
          <p className="text-foreground font-bold text-base leading-tight">{resale.title}</p>
          <p className="text-foreground/50 text-xs mt-0.5">{resale.location}</p>

          {resale.investmentTypeLabel && (
            <span className="inline-flex items-center gap-1.5 mt-2 bg-accent/15 text-accent text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <RiBuildingLine className="h-3 w-3" />
              {resale.investmentTypeLabel}
            </span>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-foreground/10">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="shrink-0">
                <p className="text-foreground/40 text-[10px]">Listed</p>
                <p className="text-foreground text-xs font-semibold mt-0.5">
                  {formatDate(listedDate, { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="w-px h-8 bg-foreground/10 shrink-0" />
              <div className="shrink-0">
                <p className="text-foreground/40 text-[10px]">Quantity</p>
                <p className="text-foreground text-xs font-semibold mt-0.5">
                  {resale.quantityLabel ?? `${resale.quantity} Unit${resale.quantity !== 1 ? 's' : ''}`}
                </p>
              </div>
              {fin && (
                <>
                  <div className="w-px h-8 bg-foreground/10 shrink-0" />
                  <div className="shrink-0">
                    <p className="text-foreground/40 text-[10px]">Est. Payout</p>
                    <p className="text-accent text-xs font-semibold mt-0.5">
                      {formatCurrency(fin.netPayout)}
                    </p>
                  </div>
                </>
              )}
            </div>
            <RiArrowRightSLine className="h-4 w-4 text-foreground/25 shrink-0" />
          </div>
        </div>
      </div>

      {/* ── Listing details ── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
        <p className="text-foreground font-bold text-sm mb-1">Listing details</p>
        <div>
          <DetailRow label="Reference" value={resale.reference} />
          {resale.investmentTypeLabel && (
            <DetailRow label="Investment type" value={resale.investmentTypeLabel} />
          )}
          <DetailRow
            label="Quantity"
            value={resale.quantityLabel ?? `${resale.quantity} Unit${resale.quantity !== 1 ? 's' : ''}`}
          />
          <DetailRow label="Price range" value={priceRangeLabel} />
          {fin && (
            <>
              <DetailRow label="Gross amount" value={formatCurrency(fin.grossAmount)} />
              <DetailRow
                label={fin.listingFeeRate != null
                  ? `Listing fee (${(fin.listingFeeRate * 100).toFixed(1)}%)`
                  : 'Listing fee'}
                value={formatCurrency(fin.listingFee)}
              />
              <DetailRow
                label={fin.processingFeeRate != null
                  ? `Processing fee (${(fin.processingFeeRate * 100).toFixed(1)}%)`
                  : 'Processing fee'}
                value={formatCurrency(fin.processingFee)}
              />
              <DetailRow
                label={resale.status === 'sold' ? 'Net payout' : 'Est. net payout'}
                value={formatCurrency(fin.netPayout)}
                valueClass="text-accent"
                noBorder
              />
            </>
          )}
        </div>
      </div>

      {/* ── Status section ── */}
      {(resale.status === 'pending' || resale.status === 'approved') && (
        <div className={cn(
          'rounded-2xl p-4 flex items-start gap-3',
          resale.status === 'approved'
            ? 'bg-green-500/10 border border-green-500/20'
            : 'bg-amber-500/10 border border-amber-500/20',
        )}>
          <div className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5',
            resale.status === 'approved' ? 'bg-green-500' : 'bg-amber-500',
          )}>
            {resale.status === 'approved'
              ? <RiCheckLine className="h-4 w-4 text-white" />
              : <RiTimeLine className="h-4 w-4 text-white" />
            }
          </div>
          <div>
            <p className={cn(
              'font-semibold text-sm',
              resale.status === 'approved' ? 'text-green-400' : 'text-amber-400',
            )}>
              {resale.status === 'approved' ? 'Listing Live' : 'Under review'}
            </p>
            <p className="text-foreground/50 text-xs mt-1 leading-relaxed">
              {resale.status === 'approved'
                ? 'Your listing is live and visible to other investors on the platform.'
                : 'Our team is reviewing your listing. You will be notified when it goes live.'}
            </p>
          </div>
        </div>
      )}

      {resale.status === 'sold' && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <RiCheckLine className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-green-400 font-semibold text-sm">Listing Sold</p>
            <p className="text-foreground/50 text-xs mt-1 leading-relaxed">
              Your listing has been sold. Payout has been credited to your wallet.
            </p>
          </div>
        </div>
      )}

      {resale.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <RiInformationLine className="h-4.5 w-4.5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Listing Rejected</p>
            {resale.rejectionReason && (
              <p className="text-foreground/50 text-xs mt-1 leading-relaxed">{resale.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {resale.status === 'cancelled' && (
        <div className="bg-foreground/5 border border-foreground/15 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-foreground/15 flex items-center justify-center shrink-0">
            <RiCloseLine className="h-4 w-4 text-foreground/50" />
          </div>
          <p className="text-foreground/50 text-sm">This listing has been cancelled.</p>
        </div>
      )}

      {/* ── Reference copy row ── */}
      <button
        onClick={handleCopyRef}
        className="w-full flex items-center justify-between bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-left hover:bg-foreground/8 transition-colors"
      >
        <div>
          <p className="text-foreground/40 text-xs">Listing Reference</p>
          <p className="text-foreground text-sm font-mono font-medium mt-0.5 break-all">{resale.reference}</p>
        </div>
        <RiFileCopyLine className="h-4 w-4 text-foreground/30 shrink-0 ml-3" />
      </button>

      {/* ── Actions ── */}
      {resale.status === 'pending' && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 h-12 border-amber-500/40 text-amber-400 hover:bg-amber-500/10 rounded-xl font-semibold"
            onClick={handleCancel}
            disabled={cancelMutation.isPending || deleteMutation.isPending}
          >
            Cancel listing
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-12 border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-xl font-semibold"
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

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <SheetTitle className="sr-only">Listing details</SheetTitle>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/10 shrink-0 pr-14">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-foreground font-bold text-sm">Listing details</p>
          {resale?.reference && (
            <p className="text-foreground/35 text-[10px] font-mono truncate mt-0.5">
              {resale.reference}
            </p>
          )}
        </div>
        {resale && <StatusBadge status={resale.status} />}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-52 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : resale ? (
          <ResaleDetailBody resale={resale} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-foreground/40 text-sm">Could not load listing details.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={!!resaleId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden',
          isMobile ? 'rounded-t-2xl h-[92vh]' : 'h-full sm:max-w-lg',
        )}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}
