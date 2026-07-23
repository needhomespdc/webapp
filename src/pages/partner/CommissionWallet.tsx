import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiArrowRightLine,
  RiArrowUpLine,
  RiBankLine,
  RiEyeLine,
  RiEyeOffLine,
  RiMoneyDollarCircleLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { HiBuildingOffice2 } from 'react-icons/hi2';
import { useCommissionWallet, useCommissionEntries, useRequestCommissionPayout } from '@/hooks/usePartner';
import { useBankAccounts } from '@/hooks/useWallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { CommissionDetailSheet } from '@/components/partner/CommissionDetailSheet';
import type { BankAccount, CommissionEntry } from '@/types';

const DEFAULT_MIN_PAYOUT = 50_000;

export default function CommissionWallet() {
  const navigate = useNavigate();
  const { wallet, isLoading: walletLoading } = useCommissionWallet();
  const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
  const { entries, isLoading: entriesLoading } = useCommissionEntries(1, 3);

  const [showBalance, setShowBalance] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Commission Wallet</h1>
        <p className="text-foreground/50 text-sm mt-1">
          Track commission balances, request payouts, and review earnings.
        </p>
      </div>

      {/* ── Balance card ─────────────────────────────────────────────────────── */}
      <div className="bg-primary rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-white/60 text-xs">Available Balance</p>
          <button
            onClick={() => setShowBalance((v) => !v)}
            className="text-white/40 hover:text-white/70 transition-colors"
          >
            {showBalance
              ? <RiEyeLine className="h-3.5 w-3.5" />
              : <RiEyeOffLine className="h-3.5 w-3.5" />}
          </button>
        </div>

        {walletLoading ? (
          <Skeleton className="h-9 w-44 bg-white/10 mb-4" />
        ) : showBalance ? (
          <div className="mb-4">
            <CurrencyDisplay amount={wallet?.availableBalance ?? 0} size="xl" className="text-white" />
          </div>
        ) : (
          <p className="text-3xl font-bold text-white/30 tracking-widest mb-4">••••••</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Pending</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {walletLoading ? '...' : showBalance ? formatCurrency(wallet?.pendingCommissions ?? 0) : '••••••'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Total Earned</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {walletLoading ? '...' : showBalance ? formatCurrency(wallet?.totalEarned ?? 0) : '••••••'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Action buttons ────────────────────────────────────────────────────── */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-foreground/10">
            <button
              onClick={() => setPayoutOpen(true)}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <RiArrowUpLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Request Payout</p>
                <p className="text-foreground/40 text-xs">Withdraw commissions</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/partner/commission-earnings')}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <RiMoneyDollarCircleLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Commission History</p>
                <p className="text-foreground/40 text-xs">View all earnings</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Bank accounts ─────────────────────────────────────────────────────── */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          {banksLoading ? (
            <div className="p-4"><Skeleton className="h-5 w-48" /></div>
          ) : !bankAccounts.length ? (
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-foreground/50 text-sm">No bank account linked yet.</p>
              <button
                onClick={() => navigate('/partner/add-bank-account')}
                className="text-accent text-sm font-semibold hover:underline"
              >
                Link account
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
                <h2 className="text-foreground font-semibold text-sm">Payout Accounts</h2>
              </div>
              <div className="divide-y divide-foreground/10">
                {bankAccounts.map((b: BankAccount) => (
                  <div key={b.id} className="flex items-center gap-3 px-4 py-3 flex-wrap">
                    <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
                      <RiBankLine className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="flex items-center gap-2">
                        <p className="text-foreground text-sm font-medium min-w-0 flex items-center gap-1">
                          <span className="truncate">{b.shortName}</span>
                          <span className="shrink-0 hidden sm:inline">— {b.accountNumber}</span>
                        </p>
                        {b.isPrimary && (
                          <span className="text-xs bg-emerald-700/10 p-1 rounded-xl text-emerald-700 font-medium shrink-0">Primary</span>
                        )}
                      </span>
                      <p className="text-foreground/40 text-xs">{b.accountHolderName}</p>
                    </div>
                    <button
                      className="p-1.5 text-accent transition-colors flex cursor-pointer items-center"
                      onClick={() => navigate('/partner/add-bank-account')}
                    >
                      <span className="text-xs font-medium">Manage</span>
                      <RiArrowRightLine className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Minimum payout notice ─────────────────────────────────────────────── */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
        <p className="text-amber-500 text-sm font-medium">
          Minimum payout: {formatCurrency(wallet?.minimumPayout ?? DEFAULT_MIN_PAYOUT)}
          {wallet?.payoutFeePercent ? ` · ${wallet.payoutFeePercent}% processing fee` : ''}
        </p>
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <h2 className="text-foreground font-semibold">Recent Activity</h2>
          <button
            onClick={() => navigate('/partner/commission-earnings')}
            className="text-accent text-sm font-medium hover:underline"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-foreground/10">
          {entriesLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !entries.length ? (
            <div className="py-10">
              <EmptyState
                icon={<RiWallet3Line />}
                title="No recent activity"
                description="Your recent commission earnings will appear here."
              />
            </div>
          ) : (
            entries.map((entry: CommissionEntry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedEntryId(entry.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left"
              >
                {entry.propertyImageUrl ? (
                  <img src={entry.propertyImageUrl} alt={entry.propertyTitle} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent">
                    <HiBuildingOffice2 className="h-5 w-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{entry.propertyTitle}</p>
                  <p className="text-foreground/50 text-xs truncate mt-0.5">{entry.subtitle}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-400 text-sm font-semibold">+{formatCurrency(entry.amount)}</p>
                  <p className="text-foreground/50 text-xs mt-0.5">{formatDate(entry.occurredAt)}</p>
                </div>
                <RiArrowRightLine className="h-4 w-4 text-foreground/30 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      <PayoutDialog
        open={payoutOpen}
        onOpenChange={setPayoutOpen}
        bankAccounts={bankAccounts}
        availableBalance={wallet?.availableBalance ?? 0}
        minimumPayout={wallet?.minimumPayout ?? DEFAULT_MIN_PAYOUT}
      />

      <CommissionDetailSheet
        entryId={selectedEntryId}
        onClose={() => setSelectedEntryId(null)}
      />
    </div>
  );
}

function PayoutDialog({
  open,
  onOpenChange,
  bankAccounts,
  availableBalance,
  minimumPayout,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bankAccounts: BankAccount[];
  availableBalance: number;
  minimumPayout: number;
}) {
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [pin, setPin] = useState('');
  const payoutMutation = useRequestCommissionPayout();

  const primaryBank = bankAccounts.find((b) => b.isPrimary) ?? bankAccounts[0];

  const handleClose = () => {
    onOpenChange(false);
    setAmount('');
    setPin('');
    setBankAccountId('');
  };

  const handlePayout = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (num < minimumPayout) {
      toast.error(`Minimum payout is ${formatCurrency(minimumPayout)}`);
      return;
    }
    if (num > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }
    const accountId = bankAccountId || primaryBank?.id;
    if (!accountId) {
      toast.error('Select a bank account');
      return;
    }
    if (pin.length < 4) {
      toast.error('Enter your 4-digit PIN');
      return;
    }
    payoutMutation.mutate(
      { amount: num, bankAccountId: accountId, transactionPin: pin },
      {
        onSuccess: () => {
          toast.success('Payout request submitted successfully');
          handleClose();
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Payout request failed'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw your commission earnings to a linked bank account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-foreground/40 text-xs">
              Available: {formatCurrency(availableBalance)} · Min: {formatCurrency(minimumPayout)}
            </p>
          </div>

          {bankAccounts.length > 1 && (
            <div className="space-y-2">
              <Label>Bank Account</Label>
              <select
                className="flex h-12 w-full rounded-xl bg-foreground/10 border border-foreground/10 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                value={bankAccountId || primaryBank?.id || ''}
                onChange={(e) => setBankAccountId(e.target.value)}
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id} className="bg-card">
                    {b.shortName} — {b.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Transaction PIN</Label>
            <Input
              type="password"
              maxLength={4}
              placeholder="Enter 4-digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handlePayout} disabled={payoutMutation.isPending}>
            {payoutMutation.isPending ? 'Submitting...' : 'Request Payout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
