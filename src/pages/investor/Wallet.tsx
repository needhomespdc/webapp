import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  RiAddLine,
  RiArrowRightLine,
  RiArrowUpLine,
  RiBankLine,
  RiEyeLine,
  RiEyeOffLine,
  RiFilterLine,
  RiLockPasswordLine,
  RiWallet3Line,
} from 'react-icons/ri';
import { HiArrowTrendingDown, HiArrowTrendingUp } from 'react-icons/hi2';
import {
  useWallet,
  useWalletTransactionsFeed,
  useBankAccounts,
  useTransactionPinStatus,
  useSetTransactionPin,
} from '@/hooks/useWallet';
import { cn, formatCurrency, formatRelativeDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { ApiError } from '@/lib/fetchClient';
import { TopUpSheet } from '@/components/wallet/TopUpSheet';
import { WithdrawSheet } from '@/components/wallet/WithdrawSheet';
import { TransactionDetailModal } from '@/components/wallet/TransactionDetailModal';
import { TransactionFilterSheet } from '@/components/wallet/TransactionFilterSheet';
import type { BankAccount, TxFilterState } from '@/types';
import { EMPTY_TX_FILTERS } from '@/types';
import type { TxApiFilters } from '@/api/wallet.api';

function computeApiFilters(f: TxFilterState): TxApiFilters {
  const result: TxApiFilters = {};

  if (f.type) result.type = f.type;
  if (f.status) result.status = f.status;
  if (f.direction !== 'all') result.direction = f.direction;

  if (f.dateRange === 'custom') {
    if (f.dateFrom) result.startDate = f.dateFrom;
    if (f.dateTo) result.endDate = f.dateTo;
  } else if (f.dateRange !== 'all') {
    result.dateRange = f.dateRange;
  }

  return result;
}

export default function InvestorWallet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { wallet, isLoading: walletLoading } = useWallet();
  const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
  const { isPinSet } = useTransactionPinStatus();

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(true);
  const [activeFilters, setActiveFilters] = useState<TxFilterState>(EMPTY_TX_FILTERS);

  const apiFilters = useMemo(() => computeApiFilters(activeFilters), [activeFilters]);

  const {
    data,
    isLoading: txLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWalletTransactionsFeed(apiFilters);

  const transactions = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []) ?? [],
    [data]
  );

  const activeFilterCount = [
    activeFilters.dateRange !== 'all',
    activeFilters.direction !== 'all',
    !!activeFilters.status,
    !!activeFilters.type,
  ].filter(Boolean).length;

  // Verify top-up on redirect back from Paystack
  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!reference) return;
    walletApi.verifyTopUp(reference)
      .then(() => {
        toast.success('Wallet funded successfully');
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactionsBase });
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet.transactionsFeedBase });
      })
      .catch(() => {
        toast.error('Could not verify payment. Contact support if funds were deducted.');
      })
      .finally(() => {
        setSearchParams({}, { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
        <p className="text-foreground/50 text-sm mt-1">Manage your funds and view all transactions.</p>
      </div>

      {/* ── Balance card ──────────────────────────────────────────────────────── */}
      <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-white/60 text-xs">Available Balance</p>
              <button
                onClick={() => setShowBalance((v) => !v)}
                className="text-white/40 hover:text-white/70 transition-colors"
              >
                {showBalance ? <RiEyeLine className="h-3.5 w-3.5" /> : <RiEyeOffLine className="h-3.5 w-3.5" />}
              </button>
            </div>
            {walletLoading ? (
              <Skeleton className="h-9 w-40 bg-white/10" />
            ) : showBalance ? (
              <CurrencyDisplay amount={wallet?.availableBalance ?? 0} size="xl" className="text-white" />
            ) : (
              <p className="text-3xl font-bold text-white/30 tracking-widest">••••••</p>
            )}
          </div>

          <img src="/resources/wallet-hero.png" alt="wallet_icon" className="h-20 w-20" />
        </div>

        <div className="grid grid-cols-2 gap-3 mt-1">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Total Balance</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {showBalance ? formatCurrency(wallet?.totalBalance ?? 0) : '••••••'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Locked in Investments</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {showBalance ? formatCurrency(0) : '••••••'}
            </p>
          </div>
        </div>

        {!isPinSet && (
          <button
            onClick={() => setPinOpen(true)}
            className="flex items-center gap-2 mt-3 text-amber-400 text-xs font-medium hover:underline"
          >
            <RiLockPasswordLine className="h-3.5 w-3.5" />
            Set up a transaction PIN to enable transfers
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Action buttons ──────────────────────────────────────────────────── */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-foreground/10">
            <button
              onClick={() => setTopUpOpen(true)}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                <RiAddLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Add Funds</p>
                <p className="text-foreground/40 text-xs">Top up wallet</p>
              </div>
            </button>
            <button
              onClick={() => setWithdrawOpen(true)}
              className="flex flex-col items-center gap-2 py-5 hover:bg-foreground/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center">
                <RiArrowUpLine className="h-6 w-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-foreground text-sm font-semibold">Withdraw</p>
                <p className="text-foreground/40 text-xs">To bank account</p>
              </div>
            </button>
          </div>
        </div>

        {/* ── Bank accounts ────────────────────────────────────────────────────── */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          {banksLoading ? (
            <div className="p-4"><Skeleton className="h-5 w-48" /></div>
          ) : !bankAccounts.length ? (
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-foreground/50 text-sm">No bank account linked yet.</p>
              <button
                onClick={() => navigate('/investor/add-bank-account')}
                className="text-accent text-sm font-semibold hover:underline"
              >
                Link account
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
                <h2 className="text-foreground font-semibold text-sm">Bank Accounts</h2>
              </div>
              <div className="divide-y divide-foreground/10">
                {bankAccounts.map((b: BankAccount) => (
                  <BankAccountRow
                    key={b.id}
                    shortName={b.shortName}
                    accountNumber={b.accountNumber}
                    accountHolderName={b.accountHolderName}
                    isPrimary={b.isPrimary}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Transaction history ───────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <h2 className="text-foreground font-semibold">Transaction History</h2>
          <button
            onClick={() => setFilterOpen(true)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors',
              activeFilterCount > 0
                ? 'bg-accent/15 text-accent border border-accent/30 font-medium'
                : 'border border-foreground/20 text-foreground/60 hover:border-foreground/40'
            )}
          >
            <RiFilterLine className="h-3.5 w-3.5" />
            Filter
            {activeFilterCount > 0 && (
              <span className="bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Direction tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
          {([
            { value: 'all', label: 'All' },
            { value: 'money_in', label: 'Money In' },
            { value: 'money_out', label: 'Money Out' },
          ] as const).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveFilters((f) => ({ ...f, direction: tab.value }))}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeFilters.direction === tab.value
                  ? 'bg-accent text-white'
                  : 'text-foreground/50 hover:text-foreground/80'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-foreground/10">
          {txLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !transactions.length ? (
            <div className="py-10">
              <EmptyState
                icon={<RiWallet3Line />}
                title={activeFilterCount > 0 ? 'No transactions match your filters' : 'No transactions yet'}
              />
              {activeFilterCount > 0 && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => setActiveFilters(EMPTY_TX_FILTERS)}
                    className="text-accent text-sm font-medium hover:underline"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {transactions.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => setSelectedTxId(tx.id)}
                  className="w-full flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                  }`}>
                    {tx.isCredit
                      ? <HiArrowTrendingDown className="h-4 w-4" />
                      : <HiArrowTrendingUp className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden flex-wrap">
                      <p className="text-foreground/50 text-xs truncate min-w-0">{tx.subtitle}</p>
                      <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                      }`}>
                        {tx.isCredit ? 'Money In' : 'Money Out'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${tx.isCredit ? 'text-green-400' : 'text-foreground'}`}>
                      {tx.isCredit ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-foreground/50 text-xs mt-0.5">{formatRelativeDate(tx.occurredAt ?? tx.createdAt)}</p>
                  </div>
                </button>
              ))}

              {/* Load More */}
              {hasNextPage && (
                <div className="p-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-32"
                  >
                    {isFetchingNextPage ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <TransactionFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        value={activeFilters}
        onApply={setActiveFilters}
      />

      <TopUpSheet
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        wallet={wallet ?? null}
        recentTransactions={transactions}
      />

      <WithdrawSheet
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        wallet={wallet ?? null}
        bankAccounts={bankAccounts}
        isPinSet={isPinSet}
        onSetPin={() => { setWithdrawOpen(false); setPinOpen(true); }}
      />

      <TransactionDetailModal
        transactionId={selectedTxId}
        onClose={() => setSelectedTxId(null)}
      />

      <SetPinDialog open={pinOpen} onOpenChange={setPinOpen} />
    </div>
  );
}

function BankAccountRow({
  shortName,
  accountNumber,
  accountHolderName,
  isPrimary,
}: {
  shortName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
}) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
        <RiBankLine className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <p className="text-foreground text-sm font-medium min-w-0 flex items-center gap-1">
            <span className="truncate">{shortName}</span>
            <span className="shrink-0 hidden sm:inline">— {accountNumber}</span>
          </p>
          {isPrimary && (
            <span className="text-xs bg-emerald-700/10 p-1 rounded-xl text-emerald-700 font-medium shrink-0">Primary</span>
          )}
        </span>
        <p className="text-foreground/40 text-xs">{accountHolderName}</p>
      </div>
      <button
        className="p-1.5 text-accent transition-colors flex cursor-pointer items-center"
        onClick={() => navigate('/investor/add-bank-account')}
      >
        <span className="text-xs font-medium">Manage</span>
        <RiArrowRightLine className="h-4 w-4" />
      </button>
    </div>
  );
}

function SetPinDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const setPinMutation = useSetTransactionPin();

  const handleSetPin = () => {
    if (pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }
    setPinMutation.mutate(
      { pin },
      {
        onSuccess: () => {
          toast.success('Transaction PIN set successfully');
          onOpenChange(false);
          setPin('');
          setConfirmPin('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to set PIN'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Transaction PIN</DialogTitle>
          <DialogDescription>This PIN secures your withdrawals and investments.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm PIN</Label>
            <Input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSetPin} disabled={setPinMutation.isPending}>
            {setPinMutation.isPending ? 'Saving...' : 'Set PIN'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
