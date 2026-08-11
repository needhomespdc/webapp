import Lottie from 'lottie-react';
import successAnimation from '@/assets/lottie/success-confetti.json';
import { RiFileTextLine, RiDownload2Line } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { walletApi } from '@/api/wallet.api';
import type { Transaction } from '@/types';

interface TopUpSuccessSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: Transaction;
}

export function TopUpSuccessSheet({ open, onOpenChange, transaction: tx }: TopUpSuccessSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');

  const handleDownloadReceipt = async () => {
    try {
      const blob = await walletApi.getTransactionReceipt(tx.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${tx.reference}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download receipt. Try again later.');
    }
  };

  const body = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-6 pb-4 space-y-5">
        {/* Confetti animation */}
        <div className="flex justify-center">
          <Lottie
            animationData={successAnimation}
            loop={true}
            autoplay
            style={{ width: 160, height: 160 }}
          />
        </div>

        {/* Title */}
        <div className="text-center -mt-2">
          <h2 className="text-xl font-bold text-foreground">Wallet Funded!</h2>
          <p className="text-sm text-foreground/50 mt-1 leading-relaxed">
            Your wallet has been successfully topped up and funds are ready to use.
          </p>
        </div>

        {/* Amount card */}
        <div className="bg-foreground/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-foreground/50 text-xs">Amount Funded</p>
            <p className="text-foreground text-2xl font-bold mt-1">{formatCurrency(tx.amount)}</p>
            <p className="text-foreground/40 text-xs mt-0.5">
              Processing fee: {formatCurrency(tx.feeAmount)}
            </p>
          </div>
          <img src="/resources/wallet-hero.png" alt="wallet" className="h-16 w-16" />
        </div>

        {/* Transaction details */}
        <div className="bg-foreground/5 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-sm font-semibold text-foreground">Transaction Details</p>
          </div>
          <div className="divide-y divide-foreground/10">
            <TxRow label="Transaction ID" value={tx.reference} mono />
            <TxRow
              label="Status"
              value={tx.statusLabel}
              valueClassName="capitalize font-semibold text-green-500"
            />
            <TxRow
              label="Date & Time"
              value={formatDate(tx.occurredAt ?? tx.createdAt, { hour: '2-digit', minute: '2-digit', hour12: true })}
            />
            <TxRow label="Processing Fee" value={formatCurrency(tx.feeAmount)} />
            {tx.balanceAfter != null && (
              <TxRow label="New Wallet Balance" value={formatCurrency(tx.balanceAfter)} />
            )}
          </div>
        </div>

        {/* Receipt note */}
        <div className="flex items-start gap-3 bg-foreground/5 rounded-xl p-4">
          <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <RiFileTextLine className="text-accent text-base" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Receipt sent to your email</p>
            <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">
              You can also download it below or view it anytime in your transaction history.
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 py-4 border-t border-foreground/10 shrink-0 space-y-2.5">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={() => onOpenChange(false)}
        >
          Done
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
          onClick={handleDownloadReceipt}
        >
          <RiDownload2Line className="h-4 w-4" />
          Download Receipt
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={undefined}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[90vh] flex flex-col overflow-hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Wallet Funded</SheetTitle>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={undefined}>
      <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Wallet Funded</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

function TxRow({
  label,
  value,
  mono = false,
  valueClassName,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-xs text-foreground/50 shrink-0">{label}</span>
      <span className={cn('text-xs text-foreground font-semibold text-right break-all', mono && 'font-mono text-foreground/60', valueClassName)}>
        {value}
      </span>
    </div>
  );
}
