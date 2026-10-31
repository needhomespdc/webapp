import {
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiCheckLine,
  RiCloseCircleLine,
  RiDownload2Line,
  RiEyeLine,
  RiFileCopyLine,
  RiFilePdf2Line,
  RiHistoryLine,
  RiInformationLine,
  RiTimeLine,
} from 'react-icons/ri';
import { SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useState } from 'react';
import { useCancelExit, useExitDetail } from '@/hooks/useExits';
import { Button } from '@/components/ui/button';
import { ConfirmModal } from '@/components/shared/ConfirmModal';
import { ApiError } from '@/lib/fetchClient';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { exitsApi } from '@/api/exits.api';
import type { ExitDetail, ExitTimelineStep } from '@/types';
import { ExitPropertyCard } from './ExitPropertyCard';

const CARD = 'bg-card border border-foreground/5 rounded-3xl';

// Status look per exit state (Figma, Oct 2026)
const STATUS = {
  review: {
    label: 'Under review',
    Icon: RiHistoryLine,
    pill: 'bg-amber-100 text-orange-600 dark:bg-amber-500/15 dark:text-orange-400',
    card: 'bg-amber-100 dark:bg-amber-500/15',
    title: 'text-orange-600 dark:text-orange-400 font-bold',
  },
  approved: {
    label: 'Approved',
    Icon: RiCheckboxCircleLine,
    pill: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
    card: 'bg-green-100 dark:bg-green-500/15',
    title: 'text-green-600 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    Icon: RiCloseCircleLine,
    pill: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    card: 'bg-red-100 dark:bg-red-500/15',
    title: 'text-red-600 dark:text-red-400 font-bold',
  },
  cancelled: {
    label: 'Cancelled',
    Icon: RiCloseCircleLine,
    pill: 'bg-foreground/10 text-foreground/60',
    card: 'bg-foreground/[0.07]',
    title: 'text-foreground/70 font-bold',
  },
};

/** Exits can be cancelled while still waiting for review */
const isCancellable = (s: string) => ['pending', 'under_review'].includes(s.toLowerCase());

function statusOf(s: string) {
  const k = s.toLowerCase();
  if (k === 'completed' || k === 'approved') return STATUS.approved;
  if (k === 'rejected') return STATUS.rejected;
  if (k === 'cancelled' || k === 'canceled') return STATUS.cancelled;
  return STATUS.review;
}

export function SummaryRow({
  label,
  value,
  valueClass,
  info,
}: {
  label: string;
  value: string;
  valueClass?: string;
  info?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
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
      <span className={cn('text-sm font-bold text-foreground text-right', valueClass)}>{value}</span>
    </div>
  );
}

function TimelineRow({ step }: { step: ExitTimelineStep }) {
  const done = step.status === 'completed';
  const current = step.status === 'current';
  return (
    <div className="flex items-center gap-4 py-2.5">
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
          done ? 'bg-green-600' : current ? 'bg-orange-500' : 'border border-foreground/15',
        )}
      >
        {done && <RiCheckLine className="h-4 w-4 text-white" />}
        {current && <RiTimeLine className="h-4 w-4 text-white" />}
      </div>
      <p className={cn('flex-1 font-bold text-sm', done || current ? 'text-foreground' : 'text-foreground/50')}>
        {step.title}
      </p>
      <p className="text-foreground/50 text-sm shrink-0">{done ? step.timestamp : 'Pending'}</p>
    </div>
  );
}

function ExitDetailBody({ exit, onClose }: { exit: ExitDetail; onClose: () => void }) {
  const cancelMutation = useCancelExit();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const canCancel = isCancellable(exit.status);
  const status = statusOf(exit.status);
  const fin = exit.financials;
  const isCompleted = exit.status === 'completed';
  const isSaveToOwn = exit.investmentType === 'save_to_own';
  const submitted = formatDate(exit.requestedAt, { day: '2-digit', month: 'short', year: 'numeric' });

  const message =
    status === STATUS.review
      ? `Your exit request submitted on ${submitted} is currently under review. We typically review exit requests within 1-2 business days.`
      : status === STATUS.approved
        ? `Your exit request submitted on ${submitted} has been approved.`
        : status === STATUS.rejected
          ? exit.rejectionReason || `Your exit request submitted on ${submitted} was not approved.`
          : `Your exit request submitted on ${submitted} was cancelled.`;

  const copyRef = () => {
    navigator.clipboard.writeText(exit.reference);
    toast.success('Exit ID copied');
  };

  const viewReceipt = async () => {
    try {
      const blob = await exitsApi.getReceipt(exit.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Could not load receipt. Try again later.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className={cn('flex items-center gap-2 text-sm px-4 py-1.5 rounded-full', status.pill)}>
          <status.Icon className="h-5 w-5" />
          {status.label}
        </span>
        <button onClick={copyRef} className="flex items-center gap-2 text-foreground/50 text-xs min-w-0">
          <span className="truncate">Exit ID: {exit.reference}</span>
          <RiFileCopyLine className="h-5 w-5 text-orange-500 shrink-0" />
        </button>
      </div>

      <ExitPropertyCard
        imageUrl={exit.propertyImageUrl}
        title={exit.title}
        location={exit.location}
        type={isSaveToOwn ? 'save_to_own' : undefined}
        typeLabel={isSaveToOwn ? (exit.investmentTypeLabel ?? 'Save-to-own') : undefined}
        stats={
          isSaveToOwn
            ? [
                { label: 'Units in project', value: exit.sharesLabel ?? '—' },
                { label: 'Your Ownership', value: exit.ownershipLabel ?? '—' },
                { label: 'Invested on', value: fin ? formatCurrency(fin.totalInvested) : '—' },
              ]
            : [
                { label: 'Ownership', value: exit.ownershipLabel ?? '—' },
                { label: 'Slots', value: exit.sharesLabel ?? '—' },
                { label: 'Invested', value: fin ? formatCurrency(fin.totalInvested) : '—' },
                { label: 'Current Value', value: fin ? formatCurrency(fin.currentValue) : '—' },
              ]
        }
      />

      <div className={cn('rounded-3xl p-4', status.card)}>
        <div className="flex items-center gap-3">
          <status.Icon className={cn('h-5 w-5 shrink-0', status.title)} />
          <p className={cn('text-sm', status.title)}>{status.label}</p>
          {isCompleted && (
            <button onClick={viewReceipt} className="ml-auto flex items-center gap-1 text-accent text-xs font-semibold">
              View Receipt <RiArrowRightLine className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-foreground text-sm leading-relaxed mt-2">{message}</p>
      </div>

      {fin && isSaveToOwn && (
        <div className={cn(CARD, 'px-4 pt-4 pb-2')}>
          <h2 className="text-foreground font-bold text-sm pb-3 mb-1 border-b border-foreground/10">Exit Summary</h2>
          <SummaryRow label="Property Name" value={exit.title} valueClass="font-normal" />
          <SummaryRow label="Amount saved" value={formatCurrency(fin.totalInvested)} valueClass="font-normal" />
          <SummaryRow
            label="Outstanding Balance"
            value={exit.outstandingBalance != null ? formatCurrency(exit.outstandingBalance) : '—'}
            valueClass="font-normal text-red-600 dark:text-red-400"
          />
          <SummaryRow
            label={`Exit fee (${(fin.exitFeeRate * 100).toFixed(1)}%)`}
            value={formatCurrency(fin.exitFee)}
            valueClass="font-normal"
            info="Charged on the current value of your holding when you exit."
          />
          <SummaryRow
            label={isCompleted ? 'Amount paid' : 'Amount to be paid'}
            value={formatCurrency(fin.payoutAmount)}
            valueClass="font-normal"
          />
        </div>
      )}

      {fin && !isSaveToOwn && (
        <div className={cn(CARD, 'px-4 pt-4 pb-2')}>
          <h2 className="text-foreground font-bold text-sm pb-3 mb-1 border-b border-foreground/10">Payout Summary</h2>
          <SummaryRow label="Amount Invested" value={formatCurrency(fin.totalInvested)} />
          <SummaryRow
            label="Investment gain"
            value={formatCurrency(fin.gainBeforeFee)}
            valueClass={fin.gainBeforeFee >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          />
          <SummaryRow
            label={`Exit fee (${(fin.exitFeeRate * 100).toFixed(1)}%)`}
            value={`-${formatCurrency(fin.exitFee)}`}
            info="Charged on the current value of your holding when you exit."
          />
          <div className="border-t border-foreground/10 mt-1 pt-1">
            <SummaryRow
              label={isCompleted ? 'Amount paid out' : 'Est. Amount to be paid out'}
              value={formatCurrency(fin.payoutAmount)}
            />
          </div>
        </div>
      )}

      {exit.timeline && exit.timeline.length > 0 && (
        <div className={cn(CARD, 'px-4 pt-4 pb-2')}>
          <h2 className="text-foreground font-bold text-sm pb-3 mb-1 border-b border-foreground/10">Exit Timeline</h2>
          {exit.timeline.map((step) => (
            <TimelineRow key={step.title} step={step} />
          ))}
        </div>
      )}

      {canCancel && (
        <Button
          variant="outline"
          className="w-full h-12 rounded-2xl font-semibold border-red-500/40 text-red-600 dark:text-red-400 bg-transparent hover:bg-red-500/10 hover:text-red-600"
          onClick={() => setConfirmCancel(true)}
        >
          Cancel exit request
        </Button>
      )}
      <ConfirmModal
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancel this exit request?"
        description="Your investment stays as it is, and you can request an exit again later."
        confirmLabel="Cancel request"
        variant="destructive"
        isLoading={cancelMutation.isPending}
        onConfirm={() =>
          cancelMutation.mutate(exit.id, {
            onSuccess: () => {
              toast.success('Exit request cancelled');
              setConfirmCancel(false);
              onClose();
            },
            onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to cancel exit request'),
          })
        }
      />

      {exit.documents && exit.documents.length > 0 && (
        <div className={cn(CARD, 'p-4')}>
          <h2 className="text-foreground font-bold text-sm mb-3">Documents</h2>
          <div className="space-y-2">
            {exit.documents.map((doc, i) => (
              <div key={doc.id ?? i} className="flex items-center gap-3 py-2">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <RiFilePdf2Line className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{doc.name}</p>
                  {doc.sizeLabel && (
                    <p className="text-foreground/40 text-xs">
                      {doc.type ?? 'PDF'} • {doc.sizeLabel}
                    </p>
                  )}
                </div>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-xs font-semibold flex items-center gap-1"
                >
                  <RiEyeLine className="h-3.5 w-3.5" /> View
                </a>
                <a
                  href={doc.url}
                  download={doc.name}
                  aria-label={`Download ${doc.name}`}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-accent hover:bg-foreground/5"
                >
                  <RiDownload2Line className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ExitDetailSheetProps {
  exitId: string | null;
  onClose: () => void;
}

export function ExitDetailSheet({ exitId, onClose }: ExitDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { exit, isLoading } = useExitDetail(exitId ?? undefined);

  const body = (
    <TooltipProvider delayDuration={150}>
      <div className="px-12 py-5 shrink-0">
        <DialogTitle className="text-center text-base font-bold">Exit Details</DialogTitle>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-full" />
            <Skeleton className="h-40 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        ) : exit ? (
          <ExitDetailBody exit={exit} onClose={onClose} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-foreground/40 text-sm">Could not load exit details.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );

  // Same shell as the other investment sheets: centred modal on desktop, bottom sheet on mobile
  return (
    <Dialog open={!!exitId} onOpenChange={(open) => !open && onClose()}>
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
