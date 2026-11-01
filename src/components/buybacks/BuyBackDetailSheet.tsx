import { RiBuildingLine, RiInformationLine } from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MODEL_BADGE } from '@/components/investment/modelBadge';
import { useState } from 'react';
import { useBuybackDetail, useCancelBuyback } from '@/hooks/useBuybacks';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import type { BuybackDetail } from '@/api/buybacks.api';
import { buybackAmounts, buybackStatusKey, type StatusKey } from './buyback';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';
const PILL = 'text-sm font-medium px-4 py-1 rounded-full min-w-[8rem] text-center';

// Status pill and message per request state (Figma, Oct 2026)
const STATUS: Record<StatusKey, { label: string; pill: string; message?: string; messageClass?: string }> = {
  pending: {
    label: 'Under review',
    pill: 'bg-foreground/10 text-foreground',
    message: 'Your buy back request is currently under review. We will notify you once it has been reviewed.',
    messageClass: 'text-foreground/50',
  },
  approved: { label: 'Approved', pill: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300' },
  rejected: { label: 'Rejected', pill: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  cancelled: { label: 'Cancelled', pill: 'bg-foreground/10 text-foreground/60' },
};

const plots = (b: BuybackDetail) => b.quantityLabel ?? `${b.quantity ?? 1} plot${(b.quantity ?? 1) !== 1 ? 's' : ''}`;

export function DetailRow({ label, value, info, valueClass }: { label: string; value: string; info?: string; valueClass?: string }) {
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

function Body({ b, onClose }: { b: BuybackDetail; onClose: () => void }) {
  const cancelMutation = useCancelBuyback();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const key = buybackStatusKey(b.status);
  const status = key ? STATUS[key] : { label: b.statusLabel || b.status, pill: 'bg-foreground/10 text-foreground/60' };
  const { price, fee, feeRate, net } = buybackAmounts(b);
  const typeLabel = b.investmentTypeLabel ?? 'Land banking';

  return (
    <div className="space-y-3">
      <div className={cn(CARD, 'p-4')}>
        {b.propertyImageUrl ? (
          <img src={b.propertyImageUrl} alt={b.title ?? 'Property'} className="w-full h-40 object-cover rounded-2xl" />
        ) : (
          <div className="w-full h-40 rounded-2xl bg-accent/10 flex items-center justify-center">
            <RiBuildingLine className="h-10 w-10 text-accent" />
          </div>
        )}
        <div className="flex items-center justify-between gap-3 mt-3">
          <span className={cn(PILL, MODEL_BADGE[b.investmentType ?? 'land_banking'] ?? 'bg-foreground/10 text-foreground/60')}>
            {typeLabel}
          </span>
          <span className={cn(PILL, status.pill)}>{status.label}</span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-foreground/10 mt-3 bg-foreground/5 rounded-2xl py-2.5">
          {[
            {
              label: 'Date',
              value: b.createdAt ? formatDate(b.createdAt, { day: 'numeric', month: 'short', year: 'numeric' }) : '—',
              align: 'text-left',
            },
            { label: 'Quantity', value: plots(b).toLowerCase(), align: 'text-center' },
            { label: 'Amount to be paid', value: formatCurrency(net), align: 'text-right' },
          ].map(({ label, value, align }) => (
            <div key={label} className={cn('px-3 min-w-0', align)}>
              <p className="text-foreground/50 text-xs truncate">{label}</p>
              <p className="text-foreground font-bold text-sm mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>
        {key === 'rejected' ? (
          <div className="text-center text-red-600 dark:text-red-400 text-xs mt-3 leading-relaxed">
            <p className="uppercase">Reason:</p>
            <p className="mt-1">
              {b.rejectionReason || 'Your buy back request was not approved. Please contact the NeedHomes team for details.'}
            </p>
          </div>
        ) : (
          'message' in status &&
          status.message && (
            <p className={cn('text-center text-xs mt-3 leading-relaxed', status.messageClass)}>{status.message}</p>
          )
        )}
      </div>

      <div className={cn(CARD, 'p-4')}>
        <h2 className="text-foreground font-bold text-xl mb-1">Buy Back Details</h2>
        {b.reference && <DetailRow label="Reference" value={b.reference} />}
        <DetailRow label="Investment type" value={typeLabel} />
        <DetailRow label="Quantity" value={plots(b).replace(/^\d+ p/, (m) => m.toUpperCase())} />
        <DetailRow label="Proposed Buy Back Price" value={formatCurrency(b.proposedPrice ?? price)} />
        <DetailRow
          label={`Processing fee (${(feeRate * 100).toFixed(1)}%)`}
          value={formatCurrency(fee)}
          info="Deducted from the agreed buy back amount."
        />
        <DetailRow
          label="Amount to be paid"
          value={formatCurrency(net)}
          valueClass="font-bold text-green-600 dark:text-green-400"
        />
      </div>
      {key === 'pending' && (
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold border-red-500/40 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-500/10 hover:text-red-600"
          onClick={() => setConfirmCancel(true)}
        >
          Cancel buy back request
        </Button>
      )}
      <ConfirmModal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this buy back request?"
        description="Your plots stay in your portfolio, and you can request a buy back again later."
        confirmLabel="Cancel request"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={() =>
          cancelMutation.mutate(b.id, {
            onSuccess: () => {
              toast.success('Buy back request cancelled');
              setConfirmCancel(false);
              onClose();
            },
            onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to cancel buy back request'),
          })
        }
      />
    </div>
  );
}

interface Props {
  buybackId: string | null;
  onClose: () => void;
}

export function BuyBackDetailSheet({ buybackId, onClose }: Props) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { buyback, isLoading } = useBuybackDetail(buybackId ?? undefined);

  const body = (
    <TooltipProvider delayDuration={150}>
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">Buy Back Details</DialogTitle>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-80 w-full rounded-3xl" />
          </div>
        ) : buyback ? (
          <Body b={buyback} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-foreground/40 text-sm">Could not load buy back details.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={!!buybackId} onOpenChange={(open) => !open && onClose()}>
      {isMobile ? (
        <SheetContent side="bottom" className="p-0 flex flex-col overflow-hidden gap-0 bg-background h-[88vh] rounded-t-3xl">
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
