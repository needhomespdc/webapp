import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  RiDownloadLine,
  RiShareLine,
  RiArrowRightLine,
  RiInformationLine,
} from 'react-icons/ri';
import { HiArrowTrendingDown, HiArrowTrendingUp } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/fetchClient';
import type { Transaction } from '@/types';

interface TransactionDetailModalProps {
  transactionId: string | null;
  onClose: () => void;
}

export function TransactionDetailModal({ transactionId, onClose }: TransactionDetailModalProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: envelope, isLoading } = useQuery({
    queryKey: queryKeys.wallet.transaction(transactionId ?? ''),
    queryFn: () => walletApi.getTransaction(transactionId!),
    enabled: !!transactionId,
  });

  const tx: Transaction | undefined = (envelope as { data?: Transaction })?.data ?? (envelope as Transaction | undefined);

  const downloadBlob = async (action: 'download' | 'share') => {
    if (!transactionId || !tx) return;
    setIsDownloading(true);
    try {
      const blob = await walletApi.getTransactionReceipt(transactionId);
      const filename = `receipt-${tx.reference}.pdf`;

      if (action === 'share' && typeof navigator.share === 'function') {
        const file = new File([blob], filename, { type: 'application/pdf' });
        const canShare = navigator.canShare?.({ files: [file] }) ?? true;
        if (canShare) {
          await navigator.share({ title: `Receipt - ${tx.reference}`, files: [file] });
          return;
        }
      }

      // Fallback: trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (action === 'share') toast.success('Receipt saved to downloads');
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error(err instanceof ApiError ? err.message : 'Failed to get receipt');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'successful') return 'text-emerald-500';
    if (status === 'pending' || status === 'processing') return 'text-amber-500';
    return 'text-red-500';
  };

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-border shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">
            Transaction Details
          </SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-4">
        {isLoading || !tx ? (
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
            {/* Icon + title + amount */}
            <div className="flex flex-col items-center text-center py-4 gap-2">
              <div className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center',
                tx.isCredit ? 'bg-green-600/15' : 'bg-accent/15'
              )}>
                {tx.isCredit
                  ? <HiArrowTrendingDown className="h-9 w-9 text-green-400" />
                  : <HiArrowTrendingUp className="h-9 w-9 text-accent" />}
              </div>

              <div>
                <p className="text-base font-semibold text-foreground">{tx.title}</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {tx.subtitle && <p className="text-sm text-foreground/50">{tx.subtitle}</p>}
                  <span className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                  )}>
                    {tx.isCredit ? 'Money In' : 'Money Out'}
                  </span>
                </div>
              </div>

              <p className={cn(
                'text-3xl font-bold mt-1',
                tx.isCredit ? 'text-green-400' : 'text-foreground'
              )}>
                {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
              </p>
              <p className="text-sm text-foreground/50">
                {formatDate(tx.occurredAt ?? tx.createdAt, {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            </div>

            {/* Detail fields */}
            <div className="bg-foreground/5 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Transaction Details</p>
              </div>
              <div className="divide-y divide-border">
                {tx.detailFields?.length ? (
                  tx.detailFields.map((field) => (
                    <div key={field.label} className="flex items-start justify-between px-4 py-3 gap-3">
                      <span className="text-sm text-foreground/50 shrink-0">{field.label}</span>
                      <span className={cn(
                        'text-sm text-right font-medium break-all',
                        field.highlightValue ? 'text-accent' : 'text-foreground'
                      )}>
                        {field.value}
                      </span>
                    </div>
                  ))
                ) : (
                  <>
                    <DetailRow label="Transaction ID" value={tx.reference} />
                    <DetailRow label="Type" value={tx.typeLabel} />
                    <DetailRow
                      label="Date & Time"
                      value={formatDate(tx.occurredAt ?? tx.createdAt, {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    />
                    <DetailRow label="Status" value={tx.statusLabel} valueClass={statusColor(tx.status)} />
                    {tx.balanceAfter !== undefined && (
                      <DetailRow
                        label="Wallet Balance After"
                        value={formatCurrency(tx.balanceAfter)}
                        valueClass="text-accent"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Need Help */}
            <button
              onClick={() => { onClose(); navigate('/investor/support'); }}
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

      {/* Receipt buttons */}
      {tx && (
        <div className="px-5 py-4 border-t border-border shrink-0 space-y-2">
          <Button
            className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl gap-2"
            onClick={() => downloadBlob('download')}
            disabled={isDownloading}
          >
            <RiDownloadLine className="text-base" />
            {isDownloading ? 'Preparing...' : 'Download Receipt'}
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 rounded-xl gap-2 font-semibold border-foreground/25 text-foreground hover:bg-foreground/5"
            onClick={() => downloadBlob('share')}
            disabled={isDownloading}
          >
            <RiShareLine className="text-base" />
            Share Receipt
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={!!transactionId} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[90vh] flex flex-col overflow-hidden">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={!!transactionId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Transaction Details</DialogTitle>
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
