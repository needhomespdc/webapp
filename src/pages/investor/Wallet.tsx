import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  useWalletTransactions,
  useBankAccounts,
  // useTopUpWallet,
  // useWithdraw,
  // useRemoveBankAccount,
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
import { ApiError } from '@/lib/fetchClient';
import { BankAccount } from '@/types';

export default function InvestorWallet() {
  const navigate = useNavigate();
  const { wallet, isLoading: walletLoading } = useWallet();
  const { transactions, isLoading: txLoading } = useWalletTransactions(1, 20);
  const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
  const { isPinSet } = useTransactionPinStatus();

  console.log("BANK HELLO", bankAccounts);

  // const [topUpOpen, setTopUpOpen] = useState(false);
  // const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [txFilter, setTxFilter] = useState<'all' | 'in' | 'out'>('all');

  const filteredTx = transactions.filter((tx) => {
    if (txFilter === 'in') return tx.isCredit;
    if (txFilter === 'out') return !tx.isCredit;
    return true;
  });

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
          <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
            <RiWallet3Line className="h-8 w-8 text-accent" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Total Balance</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {showBalance ? formatCurrency(wallet?.totalBalance ?? 0) : '••••••'}
            </p>
          </div>
          <div className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white/50 text-[10px]">Locked in Investments</p>
            <p className="text-white text-sm font-semibold mt-0.5">
              {showBalance ? formatCurrency(0) : '••••••'} {/* TODO: */}
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

      {/* ── Action buttons ────────────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-foreground/10">
          <button
            // onClick={() => setTopUpOpen(true)}
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
            // onClick={() => setWithdrawOpen(true)}
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

      {/* ── Bank accounts ─────────────────────────────────────────────────────── */}
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
              {/* <button
                onClick={() => navigate('/investor/add-bank-account')}
                className="text-accent text-sm font-medium hover:underline flex items-center gap-1"
              >
                <RiAddLine className="h-3.5 w-3.5" /> Add
              </button> */}
            </div>
            <div className="divide-y divide-foreground/10">
              {bankAccounts.map((b: BankAccount) => (
                <BankAccountRow
                  key={b.id}
                  // bankAccountId={b.id}
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

      {/* ── Transaction history ───────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
          <h2 className="text-foreground font-semibold">Transaction History</h2>
          <button className="flex items-center gap-1.5 border border-foreground/20 rounded-full px-3 py-1.5 text-foreground/60 text-xs hover:border-foreground/40 transition-colors">
            <RiFilterLine className="h-3.5 w-3.5" />
            Filter
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-foreground/10">
          {(['all', 'in', 'out'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTxFilter(tab)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                txFilter === tab
                  ? 'bg-accent text-white'
                  : 'text-foreground/50 hover:text-foreground/80'
              )}
            >
              {tab === 'all' ? 'All' : tab === 'in' ? 'Money In' : 'Money Out'}
            </button>
          ))}
        </div>

        {/* Rows */}
        <div className="divide-y divide-foreground/10">
          {txLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !filteredTx.length ? (
            <div className="py-10">
              <EmptyState icon={<RiWallet3Line />} title="No transactions yet" />
            </div>
          ) : (
            filteredTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  tx.isCredit ? 'bg-green-600/15 text-green-400' : 'bg-accent/15 text-accent'
                }`}>
                  {tx.isCredit
                    ? <HiArrowTrendingDown className="h-4 w-4" />
                    : <HiArrowTrendingUp className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-foreground/50 text-xs truncate">{tx.subtitle}</p>
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
              </div>
            ))
          )}
        </div>
      </div>

      {/* <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} /> */}
      {/* <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        bankAccounts={bankAccounts}
        balance={wallet?.availableBalance ?? 0}
      /> */}
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
  // bankAccountId: string;
  shortName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
}) {
  const navigate = useNavigate();
  // const removeMutation = useRemoveBankAccount();

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
        <RiBankLine className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="flex items-center gap-2">
          <p className="text-foreground text-sm font-medium">{shortName} — {accountNumber}</p>
          {isPrimary && <span className="text-xs bg-emerald-700/10 p-1 rounded-xl text-emerald-700 font-medium shrink-0">Primary</span>}
        </span>
        <p className="text-foreground/40 text-xs">{accountHolderName}</p>
      </div>
      <button
        className="p-1.5 text-accent transition-colors flex cursor-pointer"
        onClick={() => navigate("/investor/add-bank-account")}
      >
        <span className="text-xs font-medium">Manage</span>
        <RiArrowRightLine className="h-4 w-4" />
      </button>
    </div>
  );
}

// function TopUpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
//   const [amount, setAmount] = useState('');
//   const topUpMutation = useTopUpWallet();

//   const handleTopUp = () => {
//     const numAmount = parseFloat(amount);
//     if (!numAmount || numAmount <= 0) {
//       toast.error('Enter a valid amount');
//       return;
//     }
//     topUpMutation.mutate(
//       { amount: numAmount, paymentMethod: 'card' },
//       {
//         onSuccess: (res) => {
//           window.location.href = res.data.paymentUrl;
//         },
//         onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Top up failed'),
//       }
//     );
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Top Up Wallet</DialogTitle>
//           <DialogDescription>You'll be redirected to Paystack to complete payment.</DialogDescription>
//         </DialogHeader>
//         <div className="space-y-2">
//           <Label>Amount</Label>
//           <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
//           <Button onClick={handleTopUp} disabled={topUpMutation.isPending}>
//             {topUpMutation.isPending ? 'Processing...' : 'Continue to Payment'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

// function WithdrawDialog({
//   open,
//   onOpenChange,
//   bankAccounts,
//   balance,
// }: {
//   open: boolean;
//   onOpenChange: (v: boolean) => void;
//   bankAccounts: { id: string; shortName: string; accountNumber: string; isPrimary: boolean }[];
//   balance: number;
// }) {
//   const [amount, setAmount] = useState('');
//   const [bankAccountId, setBankAccountId] = useState('');
//   const [pin, setPin] = useState('');
//   const withdrawMutation = useWithdraw();

//   const handleWithdraw = () => {
//     const numAmount = parseFloat(amount);
//     if (!numAmount || numAmount <= 0) {
//       toast.error('Enter a valid amount');
//       return;
//     }
//     if (numAmount > balance) {
//       toast.error('Insufficient balance');
//       return;
//     }
//     const accountId = bankAccountId || bankAccounts.find((b) => b.isPrimary)?.id || bankAccounts[0]?.id;
//     if (!accountId) {
//       toast.error('Add a bank account first');
//       return;
//     }
//     withdrawMutation.mutate(
//       { amount: numAmount, bankAccountId: accountId, transactionPin: pin },
//       {
//         onSuccess: () => {
//           toast.success('Withdrawal initiated');
//           onOpenChange(false);
//           setAmount('');
//           setPin('');
//         },
//         onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Withdrawal failed'),
//       }
//     );
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Withdraw Funds</DialogTitle>
//         </DialogHeader>
//         <div className="space-y-4">
//           <div className="space-y-2">
//             <Label>Amount</Label>
//             <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
//           </div>
//           <div className="space-y-2">
//             <Label>Bank Account</Label>
//             <select
//               className="flex h-14 w-full rounded-xl bg-foreground/10 border border-foreground/10 px-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
//               value={bankAccountId}
//               onChange={(e) => setBankAccountId(e.target.value)}
//             >
//               <option value="" disabled>Select bank account</option>
//               {bankAccounts.map((b) => (
//                 <option key={b.id} value={b.id} className="bg-card">
//                   {b.shortName} — {b.accountNumber}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="space-y-2">
//             <Label>Transaction PIN</Label>
//             <Input
//               type="password"
//               maxLength={4}
//               placeholder="Enter 4-digit PIN"
//               value={pin}
//               onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
//             />
//           </div>
//         </div>
//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
//           <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending || pin.length < 4}>
//             {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }

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
