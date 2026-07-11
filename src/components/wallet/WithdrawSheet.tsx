import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiBankLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiLockPasswordLine,
  RiTimeLine,
  RiDownload2Line,
} from 'react-icons/ri';
import Lottie from 'lottie-react';
import successAnimation from '@/assets/lottie/success-confetti.json';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { useWithdraw } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/fetchClient';
import type { Wallet, BankAccount, Transaction, ApiResponse } from '@/types';
import { LottieLoader } from '@/components/shared/LottieLoader';
import { walletApi } from '@/api/wallet.api';

const QUICK_AMOUNTS = [5000, 10000, 50000, 100000, 200000];

interface WithdrawSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  wallet: Wallet | null;
  bankAccounts: BankAccount[];
  isPinSet: boolean;
  onSetPin: () => void;
}

export function WithdrawSheet({
  open,
  onOpenChange,
  wallet,
  bankAccounts,
  isPinSet,
  onSetPin,
}: WithdrawSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const navigate = useNavigate();
  const [rawAmount, setRawAmount] = useState('');
  const [step, setStep] = useState<'form' | 'pin' | 'success'>('form');
  const [pin, setPin] = useState('');
  const [withdrawalTx, setWithdrawalTx] = useState<Transaction | null>(null);
  const withdrawMutation = useWithdraw();

  const numAmount = parseInt(rawAmount, 10) || 0;
  const displayAmount = rawAmount ? numAmount.toLocaleString('en-NG') : '';
  const primaryBank = bankAccounts.find((b) => b.isPrimary) ?? bankAccounts[0];
  const availableBalance = wallet?.availableBalance ?? 0;

  useEffect(() => {
    if (!open) {
      setRawAmount('');
      setStep('form');
      setPin('');
      setWithdrawalTx(null);
    }
  }, [open]);

  const handleProceed = () => {
    if (numAmount < 5000) { toast.error('Minimum withdrawal amount is ₦5,000'); return; }
    if (numAmount > availableBalance) { toast.error('Insufficient balance'); return; }
    if (!primaryBank) { toast.error('No bank account linked'); return; }
    setStep('pin');
  };

  const handleConfirmWithdraw = () => {
    withdrawMutation.mutate(
      { amount: numAmount, bankAccountId: primaryBank!.id, transactionPin: pin },
      {
        onSuccess: (res) => {
          // Handle both wrapped { data: Transaction } and unwrapped Transaction shapes
          const raw = res as unknown as Record<string, unknown>;
          const tx = (raw.data ?? raw) as Transaction;
          setWithdrawalTx(tx ?? null);
          setStep('success');
        },
        onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Withdrawal failed'),
      }
    );
  };

  // ── Form view ─────────────────────────────────────────────────────────────────
  const formView = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-5 pb-3 border-b border-foreground/10 shrink-0">
        <SheetHeader>
          <SheetTitle className="text-base font-semibold text-foreground text-left">Withdraw</SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5">
        <div className="bg-primary rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-white/60 text-xs">Available Balance</p>
            <p className="text-white text-2xl font-bold mt-1">{formatCurrency(availableBalance)}</p>
            <p className="text-white/40 text-[11px] mt-0.5">This is your withdrawable balance</p>
          </div>
          <img src="/resources/wallet-hero.png" alt="wallet_icon" className="h-20 w-20" />
        </div>

        {!isPinSet && (
          <button
            onClick={() => { onOpenChange(false); onSetPin(); }}
            className="w-full flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-left"
          >
            <RiLockPasswordLine className="text-amber-500 text-xl shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Set up a transaction PIN first</p>
              <p className="text-xs text-amber-500/80 mt-0.5">Required to authorize withdrawals</p>
            </div>
            <RiArrowRightLine className="text-amber-500 shrink-0" />
          </button>
        )}

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
              onChange={(e) => setRawAmount(e.target.value.replace(/[^0-9]/g, ''))}
            />
          </div>
          <p className="text-xs text-foreground/40">Minimum amount is ₦5,000</p>
        </div>

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

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground/70">Withdraw To</p>
          {!primaryBank ? (
            <div className="bg-foreground/5 rounded-xl p-4 text-center space-y-2">
              <p className="text-sm text-foreground/50">No bank account linked</p>
              <button
                onClick={() => { onOpenChange(false); navigate('/investor/add-bank-account'); }}
                className="text-accent text-sm font-semibold hover:underline"
              >
                Add bank account
              </button>
            </div>
          ) : (
            <>
              <div className="bg-foreground/5 rounded-xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-card border border-foreground/10 flex items-center justify-center shrink-0">
                  {primaryBank.logoUrl ? (
                    <img src={primaryBank.logoUrl} alt={primaryBank.shortName} className="w-8 h-8 object-contain" />
                  ) : (
                    <RiBankLine className="text-xl text-foreground/40" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{primaryBank.fullName ?? primaryBank.shortName}</p>
                  <p className="text-xs text-foreground/50 mt-0.5">{primaryBank.maskedAccountNumber ?? primaryBank.accountNumber}</p>
                </div>
                <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Primary Account
                </span>
              </div>
              <button
                onClick={() => { onOpenChange(false); navigate('/investor/add-bank-account'); }}
                className="w-full flex items-center gap-3 border border-accent/30 rounded-xl p-3.5 hover:bg-accent/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <RiBankLine className="text-accent text-base" />
                </div>
                <span className="flex-1 text-sm font-medium text-accent">Change Bank Account</span>
                <RiArrowRightLine className="text-accent shrink-0" />
              </button>
            </>
          )}
        </div>

        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <RiInformationLine className="text-amber-500 shrink-0" />
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">Important Information</p>
          </div>
          <ul className="space-y-1 pl-1">
            <li className="text-xs text-foreground/60 flex gap-1.5">
              <span className="text-amber-500 shrink-0">•</span>
              Withdrawals are processed to your linked bank account.
            </li>
            <li className="text-xs text-foreground/60 flex gap-1.5">
              <span className="text-amber-500 shrink-0">•</span>
              Processing time is typically within 24 hours.
            </li>
          </ul>
        </div>

        {numAmount > 0 && (
          <div className="bg-foreground/5 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold text-foreground">Withdrawal Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-foreground/50">Amount</span>
              <span className="font-medium text-foreground">{formatCurrency(numAmount)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-foreground/10 pt-2 mt-1">
              <span className="font-semibold text-foreground">Total Deducted</span>
              <span className="font-bold text-foreground">{formatCurrency(numAmount)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0 space-y-2">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleProceed}
          disabled={!isPinSet || numAmount < 5000 || !primaryBank}
        >
          Proceed
        </Button>
        <div className="flex items-center justify-center gap-1.5 text-xs text-foreground/40">
          <RiShieldCheckLine className="shrink-0" />
          <span>Secured with 256-bit encryption</span>
        </div>
      </div>
    </div>
  );

  // ── PIN confirmation view ─────────────────────────────────────────────────────
  const pinView = (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {withdrawMutation.isPending && (
        <LottieLoader overlay size={120} label="Processing withdrawal…" />
      )}

      <div className="px-5 pt-5 pb-3 border-b border-foreground/10 shrink-0 flex items-center gap-3">
        <button
          onClick={() => setStep('form')}
          className="text-foreground/50 hover:text-foreground transition-colors"
          disabled={withdrawMutation.isPending}
        >
          <RiArrowLeftLine className="h-5 w-5" />
        </button>
        <SheetHeader className="flex-1">
          <SheetTitle className="text-base font-semibold text-foreground text-left">Confirm Transaction</SheetTitle>
        </SheetHeader>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6 space-y-6">
        <p className="text-sm text-foreground/50 text-center">
          Enter your 4-digit PIN to authorize this withdrawal
        </p>

        <div className="bg-foreground/5 rounded-2xl p-5 text-center space-y-1">
          <p className="text-3xl font-bold text-foreground">{formatCurrency(numAmount)}</p>
          <p className="text-xs text-foreground/50 truncate">
            To {primaryBank?.shortName ?? ''} · {primaryBank?.maskedAccountNumber ?? primaryBank?.accountNumber ?? ''}
          </p>
        </div>

        <PinBoxes value={pin} onChange={setPin} />
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleConfirmWithdraw}
          disabled={pin.length < 4 || withdrawMutation.isPending}
        >
          Confirm Withdrawal
        </Button>
      </div>
    </div>
  );

  // ── Success view ──────────────────────────────────────────────────────────────
  const txAmount = withdrawalTx?.amount ?? numAmount;
  const txFee = withdrawalTx?.feeAmount ?? 0;
  const youReceive = txAmount - txFee;


  const handleDownloadReceipt = async () => {
    const txId = withdrawalTx?.id;
    if (!txId) return;
    try {
      const blob = await walletApi.getTransactionReceipt(txId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${withdrawalTx?.reference ?? txId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download receipt. Try again later.');
    }
  };

  const successView = (
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
          <h2 className="text-xl font-bold text-foreground">Withdrawal Submitted!</h2>
          <p className="text-sm text-foreground/50 mt-1 leading-relaxed">
            Your withdrawal request has been received and is being processed.
          </p>
        </div>

        {/* Amount card */}
        <div className="bg-foreground/5 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-foreground/50 text-xs">Amount Withdrawn</p>
            <p className="text-foreground text-2xl font-bold mt-1">{formatCurrency(txAmount)}</p>
            <p className="text-foreground/40 text-xs mt-0.5">
              Processing fee: {formatCurrency(txFee)}
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
            <TxRow
              label="Transaction ID"
              value={withdrawalTx?.reference ?? '—'}
              mono
            />
            <TxRow
              label="Status"
              value={withdrawalTx?.statusLabel ?? 'Pending'}
              valueClassName="capitalize font-semibold"
            />
            <TxRow
              label="To"
              value={`${primaryBank?.fullName ?? primaryBank?.shortName ?? ''} · ${primaryBank?.maskedAccountNumber ?? primaryBank?.accountNumber ?? ''}`}
            />
            <TxRow
              label="Date & Time"
              value={
                withdrawalTx?.occurredAt
                  ? formatDate(withdrawalTx.occurredAt, { hour: '2-digit', minute: '2-digit', hour12: true })
                  : formatDate(new Date().toISOString(), { hour: '2-digit', minute: '2-digit', hour12: true })
              }
            />
            <TxRow
              label="Processing Fee"
              value={formatCurrency(txFee)}
            />
            <TxRow
              label="You Will Receive"
              value={formatCurrency(youReceive)}
              valueClassName="text-accent font-semibold"
            />
            {withdrawalTx?.balanceAfter != null && (
              <TxRow
                label="New Wallet Balance"
                value={formatCurrency(withdrawalTx.balanceAfter)}
              />
            )}
          </div>
        </div>

        {/* Processing note */}
        <div className="flex items-start gap-3 bg-foreground/5 rounded-xl p-4">
          <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
            <RiTimeLine className="text-accent text-base" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Processing your withdrawal</p>
            <p className="text-xs text-foreground/50 mt-0.5 leading-relaxed">
              Funds are typically sent to your linked account within 24 hours.
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0 space-y-2.5">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={() => onOpenChange(false)}
        >
          Back to Wallet
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
          onClick={handleDownloadReceipt}
          disabled={!withdrawalTx?.id}
        >
          <RiDownload2Line className="h-4 w-4" />
          Download Receipt
        </Button>
      </div>
    </div>
  );

  const content =
    step === 'success' ? successView
    : step === 'pin' ? pinView
    : formView;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={step === 'success' ? undefined : onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[90vh] flex flex-col overflow-hidden">
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={step === 'success' ? undefined : onOpenChange}>
      <DialogContent className="p-0 max-w-lg rounded-2xl overflow-hidden gap-0 h-[90vh] flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Withdraw</DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

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
      <span className={cn('text-xs text-foreground text-right break-all', mono && 'font-mono', valueClassName)}>
        {value}
      </span>
    </div>
  );
}

// ── 4-box PIN input ───────────────────────────────────────────────────────────

function PinBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref0 = useRef<HTMLInputElement>(null);
  const ref1 = useRef<HTMLInputElement>(null);
  const ref2 = useRef<HTMLInputElement>(null);
  const ref3 = useRef<HTMLInputElement>(null);
  const refs = [ref0, ref1, ref2, ref3];

  const digits = value.padEnd(4, '').split('').slice(0, 4);

  const handleChange = (i: number, v: string) => {
    const d = v.replace(/\D/g, '').slice(-1);
    const arr = value.split('').slice(0, 4);
    arr[i] = d;
    const next = arr.join('').slice(0, 4);
    onChange(next);
    if (d && i < 3) refs[i + 1].current?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const arr = value.split('').slice(0, 4);
      if (!arr[i] && i > 0) {
        arr[i - 1] = '';
        onChange(arr.join(''));
        refs[i - 1].current?.focus();
      } else {
        arr[i] = '';
        onChange(arr.join(''));
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={refs[i]}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] === ' ' ? '' : digits[i]}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-14 h-14 text-center text-xl font-bold rounded-xl border-2 bg-background transition-colors outline-none focus:border-accent border-foreground/20 text-foreground"
        />
      ))}
    </div>
  );
}
