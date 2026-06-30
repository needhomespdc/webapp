import { useState } from 'react';
import {
  RiAddLine,
  RiArrowDownLine,
  RiBankLine,
  RiDeleteBinLine,
  RiLockPasswordLine,
  RiWallet3Line,
} from 'react-icons/ri';
import {
  useWallet,
  useWalletTransactions,
  useBankAccounts,
  useTopUpWallet,
  useWithdraw,
  useAddBankAccount,
  useRemoveBankAccount,
  useTransactionPinStatus,
  useSetTransactionPin,
} from '@/hooks/useWallet';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CurrencyDisplay } from '@/components/shared/CurrencyDisplay';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
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

export default function InvestorWallet() {
  const { wallet, isLoading: walletLoading } = useWallet();
  const { transactions, isLoading: txLoading } = useWalletTransactions(1, 10);
  const { bankAccounts, isLoading: banksLoading } = useBankAccounts();
  const { isPinSet } = useTransactionPinStatus();

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-white/50 text-sm mt-1">Manage your funds and transactions.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-white/50 text-xs mb-1">Available Balance</p>
          {walletLoading ? (
            <Skeleton className="h-9 w-40" />
          ) : (
            <CurrencyDisplay amount={wallet?.balance ?? 0} size="xl" className="text-white" />
          )}
          <div className="flex gap-3 mt-4">
            <Button className="flex-1" onClick={() => setTopUpOpen(true)}>
              <RiAddLine className="h-4 w-4" />
              Top Up
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setWithdrawOpen(true)}>
              <RiArrowDownLine className="h-4 w-4" />
              Withdraw
            </Button>
          </div>
          {!isPinSet && (
            <button
              onClick={() => setPinOpen(true)}
              className="flex items-center gap-2 mt-4 text-amber-400 text-xs font-medium hover:underline"
            >
              <RiLockPasswordLine className="h-4 w-4" />
              Set up a transaction PIN to enable transfers
            </button>
          )}
        </CardContent>
      </Card>

      {/* Bank accounts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold text-sm">Bank Accounts</h2>
          <Button variant="outline" size="sm" onClick={() => setAddBankOpen(true)}>
            <RiAddLine className="h-4 w-4" />
            Add
          </Button>
        </div>
        {banksLoading ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : !bankAccounts.length ? (
          <EmptyState icon={<RiBankLine />} title="No bank accounts linked" />
        ) : (
          <div className="space-y-2">
            {bankAccounts.map((b) => (
              <BankAccountRow key={b.id} bankAccountId={b.id} shortName={b.shortName} accountNumber={b.accountNumber} accountHolderName={b.accountHolderName} isPrimary={b.isPrimary} />
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h2 className="text-white font-semibold text-sm mb-3">Recent Transactions</h2>
        {txLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : !transactions.length ? (
          <EmptyState icon={<RiWallet3Line />} title="No transactions yet" />
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  tx.type === 'deposit' || tx.type === 'commission' || tx.type === 'refund'
                    ? 'bg-green-600/15 text-green-400'
                    : 'bg-red-500/15 text-red-400'
                }`}>
                  <RiWallet3Line className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium capitalize truncate">{tx.type}</p>
                  <p className="text-white/40 text-xs">{formatDate(tx.createdAt)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-semibold ${
                    tx.type === 'deposit' || tx.type === 'commission' || tx.type === 'refund'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}>
                    {tx.type === 'deposit' || tx.type === 'commission' || tx.type === 'refund' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                  <StatusBadge status={tx.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TopUpDialog open={topUpOpen} onOpenChange={setTopUpOpen} />
      <WithdrawDialog open={withdrawOpen} onOpenChange={setWithdrawOpen} bankAccounts={bankAccounts} balance={wallet?.balance ?? 0} />
      <AddBankDialog open={addBankOpen} onOpenChange={setAddBankOpen} />
      <SetPinDialog open={pinOpen} onOpenChange={setPinOpen} />
    </div>
  );
}

function BankAccountRow({
  bankAccountId,
  shortName,
  accountNumber,
  accountHolderName,
  isPrimary,
}: {
  bankAccountId: string;
  shortName: string;
  accountNumber: string;
  accountHolderName: string;
  isPrimary: boolean;
}) {
  const removeMutation = useRemoveBankAccount();

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
      <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center text-accent shrink-0">
        <RiBankLine className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium">{shortName} — {accountNumber}</p>
        <p className="text-white/40 text-xs">{accountHolderName}</p>
      </div>
      {isPrimary && <span className="text-xs text-accent font-medium shrink-0">Primary</span>}
      <button
        onClick={() => removeMutation.mutate(bankAccountId, { onError: () => toast.error('Failed to remove bank account') })}
        className="p-1.5 text-white/40 hover:text-red-400 transition-colors shrink-0"
      >
        <RiDeleteBinLine className="h-4 w-4" />
      </button>
    </div>
  );
}

function TopUpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [amount, setAmount] = useState('');
  const topUpMutation = useTopUpWallet();

  const handleTopUp = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    topUpMutation.mutate(
      { amount: numAmount, paymentMethod: 'card' },
      {
        onSuccess: (res) => {
          window.location.href = res.data.paymentUrl;
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Top up failed'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>You'll be redirected to Paystack to complete payment.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Amount</Label>
          <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleTopUp} disabled={topUpMutation.isPending}>
            {topUpMutation.isPending ? 'Processing...' : 'Continue to Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawDialog({
  open,
  onOpenChange,
  bankAccounts,
  balance,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bankAccounts: { id: string; shortName: string; accountNumber: string; isPrimary: boolean }[];
  balance: number;
}) {
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [pin, setPin] = useState('');
  const withdrawMutation = useWithdraw();

  const handleWithdraw = () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (numAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    const accountId = bankAccountId || bankAccounts.find((b) => b.isPrimary)?.id || bankAccounts[0]?.id;
    if (!accountId) {
      toast.error('Add a bank account first');
      return;
    }
    withdrawMutation.mutate(
      { amount: numAmount, bankAccountId: accountId, transactionPin: pin },
      {
        onSuccess: () => {
          toast.success('Withdrawal initiated');
          onOpenChange(false);
          setAmount('');
          setPin('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Withdrawal failed'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <select
              className="flex h-14 w-full rounded-xl bg-white/10 border border-white/10 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
            >
              <option value="" disabled>Select bank account</option>
              {bankAccounts.map((b) => (
                <option key={b.id} value={b.id} className="bg-[#111]">
                  {b.shortName} — {b.accountNumber}
                </option>
              ))}
            </select>
          </div>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleWithdraw} disabled={withdrawMutation.isPending || pin.length < 4}>
            {withdrawMutation.isPending ? 'Processing...' : 'Withdraw'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBankDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [shortName, setShortName] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const addBankMutation = useAddBankAccount();

  const handleAdd = () => {
    if (!shortName || !accountNumber || !accountHolderName) {
      toast.error('Please fill in all fields');
      return;
    }
    addBankMutation.mutate(
      { shortName, fullName: fullName || shortName, accountNumber, accountHolderName },
      {
        onSuccess: () => {
          toast.success('Bank account added');
          onOpenChange(false);
          setShortName('');
          setFullName('');
          setAccountNumber('');
          setAccountHolderName('');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to add bank account'),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input placeholder="e.g. GTBank" value={shortName} onChange={(e) => { setShortName(e.target.value); setFullName(e.target.value); }} />
          </div>
          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input placeholder="0123456789" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} />
          </div>
          <div className="space-y-2">
            <Label>Account Holder Name</Label>
            <Input placeholder="Full name on account" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={addBankMutation.isPending}>
            {addBankMutation.isPending ? 'Adding...' : 'Add Account'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
            <Input type="password" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
          </div>
          <div className="space-y-2">
            <Label>Confirm PIN</Label>
            <Input type="password" maxLength={4} value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} />
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
