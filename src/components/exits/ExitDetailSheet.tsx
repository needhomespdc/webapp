import {
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiTimeLine,
  RiInformationLine,
  RiBuildingLine,
  RiFilePdf2Line,
  RiDownload2Line,
  RiEyeLine,
  RiFileCopyLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useExitDetail } from '@/hooks/useExits';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { exitsApi } from '@/api/exits.api';
import type { ExitDetail, ExitTimelineStep } from '@/types';

// ─── Summary row ──────────────────────────────────────────────────────────────

function SummaryRow({
  label,
  value,
  valueClass,
  sub,
  subClass,
  noBorder,
}: {
  label: string;
  value: string;
  valueClass?: string;
  sub?: string;
  subClass?: string;
  noBorder?: boolean;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3', !noBorder && 'border-b border-foreground/8 last:border-0')}>
      <span className="text-xs text-foreground/50 shrink-0 pt-0.5">{label}</span>
      <div className="text-right">
        <span className={cn('text-sm font-semibold text-foreground', valueClass)}>{value}</span>
        {sub && <p className={cn('text-xs mt-0.5 font-medium', subClass ?? 'text-foreground/40')}>{sub}</p>}
      </div>
    </div>
  );
}

// ─── Timeline step ─────────────────────────────────────────────────────────────

function TimelineStep({ step, isLast }: { step: ExitTimelineStep; isLast: boolean }) {
  const isCompleted = step.status === 'completed';
  const isCurrent = step.status === 'current';

  return (
    <div className="flex gap-4">
      {/* Icon + connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0',
            isCompleted && 'bg-green-500 border-green-500',
            isCurrent && 'bg-amber-500 border-amber-500',
            !isCompleted && !isCurrent && 'bg-transparent border-foreground/20',
          )}
        >
          {isCompleted && <RiCheckLine className="h-4 w-4 text-white" />}
          {isCurrent && <RiTimeLine className="h-4 w-4 text-white" />}
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-1 mb-0.5 min-h-[20px]', isCompleted ? 'bg-green-500/30' : 'bg-foreground/10')} />
        )}
      </div>

      {/* Content */}
      <div className={cn('flex-1 min-w-0', !isLast && 'pb-5')}>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm font-semibold',
              isCompleted && 'text-foreground',
              isCurrent && 'text-amber-400',
              !isCompleted && !isCurrent && 'text-foreground/30',
            )}
          >
            {step.title}
          </p>
          <p
            className={cn(
              'text-xs shrink-0',
              step.status === 'upcoming' ? 'text-foreground/25 italic' : 'text-foreground/40',
            )}
          >
            {step.timestamp}
          </p>
        </div>
        {step.subtitle && (
          <p className={cn('text-xs mt-0.5', isCompleted ? 'text-green-400' : 'text-foreground/40')}>
            {step.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Body ─────────────────────────────────────────────────────────────────────

function ExitDetailBody({ exit }: { exit: ExitDetail }) {
  const isCompleted = exit.status === 'completed';
  const isEstimate = !isCompleted;
  const fin = exit.financials;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(exit.reference);
    toast.success('Reference copied');
  };

  const handleViewReceipt = async () => {
    try {
      const blob = await exitsApi.getReceipt(exit.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      toast.error('Could not load receipt. Try again later.');
    }
  };

  const handleDownloadDoc = (url: string, name: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    a.click();
  };

  const exitFeePercent = fin ? (fin.exitFeeRate * 100).toFixed(1) : null;

  return (
    <div className="space-y-4">

      {/* ── Status banner ── */}
      {isCompleted && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shrink-0">
              <RiCheckLine className="h-4 w-4 text-white" />
            </div>
            <p className="text-green-400 font-semibold text-sm flex-1">Exit Completed Successfully</p>
            <button
              onClick={handleViewReceipt}
              className="text-accent text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              View Receipt
              <RiArrowRightLine className="h-3.5 w-3.5" />
            </button>
          </div>
          {exit.completedAt && (
            <p className="text-foreground/50 text-xs mt-2 leading-relaxed">
              Your exit was completed on {formatDate(exit.completedAt)}. Payout has been credited to your wallet.
            </p>
          )}
        </div>
      )}

      {(exit.status === 'under_review' || exit.status === 'pending') && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center shrink-0 mt-0.5">
            <RiTimeLine className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-amber-400 font-semibold text-sm">Under Review</p>
            <p className="text-foreground/50 text-xs mt-1 leading-relaxed">
              Your exit request submitted on {formatDate(exit.requestedAt)} is currently under
              review. We typically review requests within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {exit.status === 'rejected' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
          <RiInformationLine className="h-4.5 w-4.5 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-sm">Exit Request Rejected</p>
            {exit.rejectionReason && (
              <p className="text-foreground/50 text-xs mt-1 leading-relaxed">{exit.rejectionReason}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Property card ── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        {exit.propertyImageUrl ? (
          <img
            src={exit.propertyImageUrl}
            alt={exit.title}
            className="w-full h-40 object-cover"
          />
        ) : (
          <div className="w-full h-28 bg-foreground/5 flex items-center justify-center">
            <RiBuildingLine className="h-10 w-10 text-foreground/20" />
          </div>
        )}

        <div className="p-4">
          <p className="text-foreground font-bold text-base leading-tight">{exit.title}</p>
          <p className="text-foreground/50 text-xs mt-0.5">{exit.location}</p>

          {exit.propertyType && (
            <span className="inline-flex items-center gap-1.5 mt-2 bg-accent/15 text-accent text-[11px] font-semibold px-2.5 py-1 rounded-full">
              <RiBuildingLine className="h-3 w-3" />
              {exit.propertyType}
            </span>
          )}

          {/* Stats */}
          {(exit.ownershipLabel || exit.investedOnLabel) && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 pt-4 border-t border-foreground/10">
              {exit.ownershipLabel && (
                <div>
                  <p className="text-foreground/40 text-[10px]">Your Ownership</p>
                  <p className="text-foreground text-xs font-semibold mt-0.5">{exit.ownershipLabel}</p>
                </div>
              )}
              {exit.investedOnLabel && (
                <div>
                  <p className="text-foreground/40 text-[10px]">Invested On</p>
                  <p className="text-foreground text-xs font-semibold mt-0.5">{exit.investedOnLabel}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Exit Summary ── */}
      {fin && (
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
          <p className="text-foreground font-bold text-sm mb-1">Exit Summary</p>
          <div>
            <SummaryRow
              label="Total Invested"
              value={formatCurrency(fin.totalInvested)}
            />
            <SummaryRow
              label={isEstimate ? 'Est. Total Sale Value' : 'Total Sale Value'}
              value={formatCurrency(fin.currentValue)}
            />
            {fin.gainBeforeFee >= 0 && (
              <SummaryRow
                label={isEstimate ? 'Est. Gain (Before Fee)' : 'Gain (Before Fee)'}
                value={formatCurrency(fin.gainBeforeFee)}
                valueClass={fin.gainBeforeFee > 0 ? 'text-green-400' : 'text-foreground'}
                sub={`${fin.gainPercent.toFixed(2)}%`}
                subClass={fin.gainBeforeFee > 0 ? 'text-green-400' : 'text-foreground/40'}
              />
            )}
            <SummaryRow
              label={isEstimate
                ? `Est. Exit Fee${exitFeePercent ? ` (${exitFeePercent}%)` : ''}`
                : `Exit Fee${exitFeePercent ? ` (${exitFeePercent}%)` : ''}`}
              value={`-${formatCurrency(fin.exitFee)}`}
              valueClass="text-red-400"
            />
            <SummaryRow
              label={isCompleted ? 'Amount Received' : 'Est. Payout (After Fee)'}
              value={formatCurrency(fin.payoutAmount)}
              valueClass={isCompleted ? 'text-green-400' : 'text-accent'}
              noBorder
            />
          </div>
        </div>
      )}

      {/* ── Exit Timeline ── */}
      {exit.timeline && exit.timeline.length > 0 && (
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
          <p className="text-foreground font-bold text-sm mb-4">Exit Timeline</p>
          <div>
            {exit.timeline.map((step, i) => (
              <TimelineStep
                key={step.title}
                step={step}
                isLast={i === exit.timeline!.length - 1}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Documents ── */}
      {exit.documents && exit.documents.length > 0 && (
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
          <p className="text-foreground font-bold text-sm mb-3">Documents</p>
          <div className="space-y-2">
            {exit.documents.map((doc, i) => (
              <div
                key={doc.id ?? i}
                className="flex items-center gap-3 bg-background border border-foreground/10 rounded-xl px-4 py-3"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <RiFilePdf2Line className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{doc.name}</p>
                  {doc.sizeLabel && (
                    <p className="text-foreground/40 text-xs">{doc.type ?? 'PDF'} • {doc.sizeLabel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent text-xs font-semibold flex items-center gap-1"
                  >
                    <RiEyeLine className="h-3.5 w-3.5" />
                    View
                  </a>
                  <button
                    onClick={() => handleDownloadDoc(doc.url, doc.name)}
                    className="w-7 h-7 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/40 hover:bg-foreground/5"
                  >
                    <RiDownload2Line className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Reference row ── */}
      <button
        onClick={handleCopyRef}
        className="w-full flex items-center justify-between bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 text-left hover:bg-foreground/8 transition-colors"
      >
        <div>
          <p className="text-foreground/40 text-xs">Exit Reference</p>
          <p className="text-foreground text-sm font-mono font-medium mt-0.5 break-all">{exit.reference}</p>
        </div>
        <RiFileCopyLine className="h-4 w-4 text-foreground/30 shrink-0 ml-3" />
      </button>
    </div>
  );
}

// ─── Sheet wrapper ─────────────────────────────────────────────────────────────

interface ExitDetailSheetProps {
  exitId: string | null;
  onClose: () => void;
}

export function ExitDetailSheet({ exitId, onClose }: ExitDetailSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const { exit, isLoading } = useExitDetail(exitId ?? undefined);

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <SheetTitle className="sr-only">Exit Details</SheetTitle>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-foreground/10 shrink-0 pr-14">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
        >
          <RiArrowLeftLine className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="text-foreground font-bold text-sm">Exit Details</p>
          {exit?.reference && (
            <p className="text-foreground/35 text-[10px] font-mono truncate mt-0.5">
              {exit.reference}
            </p>
          )}
        </div>
        {exit && <StatusBadge status={exit.status} />}
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
          </div>
        ) : exit ? (
          <ExitDetailBody exit={exit} />
        ) : (
          <div className="flex items-center justify-center h-40">
            <p className="text-foreground/40 text-sm">Could not load exit details.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Sheet open={!!exitId} onOpenChange={(v) => !v && onClose()}>
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
