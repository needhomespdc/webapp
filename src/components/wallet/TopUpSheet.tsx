import { useState } from 'react';
import {
  RiShieldCheckLine,
  RiBankCardLine,
  RiExchangeLine,
} from 'react-icons/ri';
import { HiArrowTrendingDown } from 'react-icons/hi2';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { useTopUpWallet } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatRelativeDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/fetchClient';
import type { Wallet, Transaction } from '@/types';

const QUICK_AMOUNTS = [5000, 10000, 50000, 100000, 200000];

interface TopUpSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wallet: Wallet | null;
  recentTransactions: Transaction[];
}

export function TopUpSheet({ open, onOpenChange, wallet, recentTransactions }: TopUpSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [rawAmount, setRawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>('card');
  const topUpMutation = useTopUpWallet();

  const numAmount = parseInt(rawAmount, 10) || 0;
  const displayAmount = rawAmount ? numAmount.toLocaleString('en-NG') : '';
  const recentFunding = recentTransactions.filter((t) => t.isCredit).slice(0, 3);

  const handleInput = (raw: string) => setRawAmount(raw.replace(/\D/g, ''));

  const handleSubmit = () => {
    if (numAmount < 5000) {
      toast.error('Minimum top-up amount is ₦5,000');
      return;
    }
    topUpMutation.mutate(
      { amount: numAmount, paymentMethod },
      {
        onSuccess: (res) => {
          const url = res.payment?.authorizationUrl;
          if (url) {
            window.location.href = url;
          } else {
            toast.error('Payment URL not received');
          }
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to initiate top-up'),
      }
    );
  };

  const content = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-foreground/10 shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">Add Funds</SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        {/* Balance */}
        <div className="bg-primary rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Your Wallet Balance</p>
            <p className="text-white text-2xl font-bold mt-1">
              {formatCurrency(wallet?.availableBalance ?? 0)}
            </p>
            <p className="text-white/40 text-[11px] mt-0.5">Available Balance</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
            <RiBankCardLine className="h-7 w-7 text-accent" />
          </div>
        </div>

        {/* Amount input */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/70">Enter Amount</p>
          <div className="bg-foreground/5 rounded-xl px-4 py-4 flex items-center gap-2">
            <span className="text-xl font-bold text-foreground/30">₦</span>
            <input
              type="text"
              inputMode="numeric"
              className="flex-1 bg-transparent text-xl font-bold text-foreground outline-none placeholder:text-foreground/25 min-w-0"
              placeholder="0"
              value={displayAmount}
              onChange={(e) => handleInput(e.target.value.replace(/,/g, ''))}
            />
          </div>
          <p className="text-xs text-foreground/40">Minimum amount is ₦5,000</p>
        </div>

        {/* Quick amount chips */}
        <div className="flex flex-wrap gap-2">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => setRawAmount(String(amt))}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                numAmount === amt
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-foreground/15 text-foreground/60 hover:border-foreground/30'
              )}
            >
              ₦{amt >= 1000 ? `${amt / 1000}k` : amt}
            </button>
          ))}
        </div>

        {/* Payment method */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/70">Payment method</p>
          <div className="space-y-2">
            {([
              {
                id: 'card' as const,
                label: 'Debit Card',
                desc: 'Pay securely with your debit card',
                icon: <RiBankCardLine className="text-lg text-accent" />,
              },
              {
                id: 'bank_transfer' as const,
                label: 'Bank Transfer',
                desc: 'Pay via bank transfer on Paystack',
                icon: <RiExchangeLine className="text-lg text-foreground/50" />,
              },
            ]).map(({ id, label, desc, icon }) => (
              <button
                key={id}
                onClick={() => setPaymentMethod(id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left',
                  paymentMethod === id
                    ? 'border-accent bg-accent/5'
                    : 'border-foreground/10 hover:border-foreground/20'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-foreground/50">{desc}</p>
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors',
                  paymentMethod === id ? 'border-accent bg-accent' : 'border-foreground/20'
                )}>
                  {paymentMethod === id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-start gap-3 bg-foreground/5 rounded-xl p-3">
          <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <RiShieldCheckLine className="text-accent" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Your payments are secure</p>
            <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">
              We use bank-level security to protect your transactions and personal data.
            </p>
          </div>
        </div>

        {/* Recent Funding */}
        {recentFunding.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Recent Topup</p>
            <div className="bg-foreground/5 rounded-xl overflow-hidden divide-y divide-border">
              {recentFunding.map((tx) => (
                <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full bg-green-600/15 flex items-center justify-center shrink-0">
                    <HiArrowTrendingDown className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{tx.title}</p>
                    <p className="text-xs text-foreground/50">{formatRelativeDate(tx.occurredAt ?? tx.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-green-400">+{formatCurrency(tx.amount)}</p>
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                      tx.status === 'successful' ? 'bg-green-600/10 text-green-500' :
                      tx.status === 'pending' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-red-500/10 text-red-500'
                    )}>
                      {tx.statusLabel}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleSubmit}
          disabled={topUpMutation.isPending || numAmount < 5000}
        >
          {topUpMutation.isPending
            ? 'Redirecting to payment...'
            : numAmount >= 5000
            ? `Add ${formatCurrency(numAmount)} to wallet`
            : 'Add to wallet'}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[90vh] flex flex-col overflow-hidden">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Add Funds</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
