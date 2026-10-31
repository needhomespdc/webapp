import { useEffect, useState } from 'react';
import Lottie from '@/components/shared/LazyLottie';
import confettiAnimation from '@/assets/lottie/success-confetti.json';
import {
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiBankCardLine,
  RiFingerprint2Line,
  RiWalletLine,
} from 'react-icons/ri';
import { DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PinInput } from '@/components/shared/PinInput';
import { PinSetModal } from '@/components/wallet/PinSetModal';
import { usePayInstallment } from '@/hooks/useInvestment';
import { useWallet } from '@/hooks/useWallet';
import { walletApi } from '@/api/wallet.api';
import { ApiError } from '@/lib/fetchClient';
import { toast } from '@/hooks/useToast';
import { formatCurrency, cn } from '@/lib/utils';
import type { Investment } from '@/types';

type Step = 'amount' | 'method' | 'pin' | 'processing' | 'success';

const TITLES: Record<Step, string> = {
  amount: 'Make Payment',
  method: 'How would you want to pay?',
  pin: 'Confirm Payment',
  processing: 'Processing…',
  success: 'Payment Successful',
};

interface Props {
  inv: Investment;
  /** Amount still owed on the plan */
  outstanding: number;
  /** Suggested amount: the next instalment due */
  suggested: number;
  /** Back to the payment details */
  onExit: () => void;
}

/**
 * Pay toward an instalment plan from inside the Payment Details modal.
 * Same pattern as the marketplace checkout: amount → wallet or card → transaction PIN → processing → success.
 */
export function MakePaymentFlow({ inv, outstanding, suggested, onExit }: Props) {
  const [step, setStep] = useState<Step>('amount');
  const [amountInput, setAmountInput] = useState(String(Math.round(Math.min(suggested || outstanding, outstanding))));
  const [pin, setPin] = useState('');
  const [cardLoading, setCardLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [loaderData, setLoaderData] = useState<object | null>(null);

  const { wallet } = useWallet();
  const payMutation = usePayInstallment(inv.id);

  const amount = parseInt(amountInput, 10) || 0;
  const amountValid = amount > 0 && amount <= outstanding;
  const balance = wallet?.availableBalance ?? 0;
  const pinReady = pin.length === 4 && !pin.includes(' ');

  useEffect(() => {
    if (step === 'processing' && !loaderData) {
      fetch('/lottie-gif/loader.json')
        .then((r) => r.json())
        .then(setLoaderData)
        .catch(() => null);
    }
  }, [step, loaderData]);

  const handleBack = () => {
    if (step === 'method') setStep('amount');
    else if (step === 'pin') setStep('method');
    else onExit();
  };

  const handleCardTransfer = async () => {
    setCardLoading(true);
    try {
      const res = await walletApi.topUp({ amount, paymentMethod: 'card' });
      const url = res.payment?.authorizationUrl;
      if (url) window.location.href = url;
      else toast.error('Could not initiate payment. Please try again.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to initiate payment.');
    } finally {
      setCardLoading(false);
    }
  };

  const handleConfirmPin = () => {
    if (!pinReady) return;
    setStep('processing');
    payMutation.mutate(
      { transactionPin: pin, amount },
      {
        onSuccess: () => setStep('success'),
        onError: (err) => {
          setStep('pin');
          setPin('');
          toast.error(err instanceof ApiError ? err.message : 'Payment failed. Please try again.');
        },
      },
    );
  };

  return (
    <>
      {/* Header: centred title, back on input steps; the modal's own close button sits top-right */}
      <div className="relative px-12 py-5 shrink-0">
        {(step === 'amount' || step === 'method' || step === 'pin') && (
          <button
            onClick={handleBack}
            aria-label="Back"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10 transition-colors"
          >
            <RiArrowLeftLine className="h-5 w-5" />
          </button>
        )}
        <DialogTitle className="text-center text-base font-bold">{TITLES[step]}</DialogTitle>
      </div>

      {/* ── Amount ── */}
      {step === 'amount' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-4">
            <div className="bg-card border border-foreground/5 rounded-3xl p-4 flex items-center justify-between">
              <span className="text-foreground/50 text-sm">Outstanding balance</span>
              <span className="text-foreground font-bold text-base">{formatCurrency(outstanding)}</span>
            </div>
            <label className="block">
              <span className="text-foreground text-sm">Amount to pay</span>
              <div className="mt-2 bg-foreground/5 border border-foreground/10 rounded-2xl flex items-center h-16 px-4 focus-within:border-accent">
                <span className="text-foreground font-bold text-2xl">₦</span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountInput ? amount.toLocaleString('en-NG') : ''}
                  onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 bg-transparent text-foreground font-bold text-2xl outline-none placeholder:text-foreground/25"
                />
              </div>
            </label>
            <div className="flex gap-2">
              {suggested > 0 && suggested < outstanding && (
                <button
                  onClick={() => setAmountInput(String(Math.round(suggested)))}
                  className="px-3 py-1.5 rounded-full bg-foreground/10 text-foreground/70 text-xs font-medium"
                >
                  Next instalment
                </button>
              )}
              <button
                onClick={() => setAmountInput(String(Math.round(outstanding)))}
                className="px-3 py-1.5 rounded-full bg-foreground/10 text-foreground/70 text-xs font-medium"
              >
                Pay full balance
              </button>
            </div>
            {amount > outstanding && (
              <p className="text-red-600 dark:text-red-400 text-xs">Amount cannot exceed your outstanding balance.</p>
            )}
            <p className="text-foreground/50 text-xs leading-relaxed">
              Payments are applied to instalments in order.
            </p>
          </div>
          <div className="bg-card px-4 pt-4 pb-5 shrink-0">
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={() => setStep('method')}
              disabled={!amountValid}
            >
              Continue
            </Button>
          </div>
        </>
      )}

      {/* ── Method ── */}
      {step === 'method' && (
        <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
          <div className="bg-card border border-foreground/5 rounded-3xl px-4 py-3 flex items-center justify-between">
            <span className="text-foreground/50 text-sm">Amount due</span>
            <span className="text-foreground font-bold text-base">{formatCurrency(amount)}</span>
          </div>
          <button
            onClick={() => setStep('pin')}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-foreground/10 hover:border-emerald-500/50 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
              <RiWalletLine className="text-emerald-500 h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm">From my wallet</p>
              <p className="text-foreground/50 text-xs mt-0.5">
                Balance:{' '}
                <span
                  className={cn(
                    'font-semibold',
                    balance >= amount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                  )}
                >
                  {formatCurrency(balance)}
                </span>
              </p>
            </div>
            <RiArrowRightSLine className="text-foreground/30 h-5 w-5 shrink-0" />
          </button>
          <button
            onClick={handleCardTransfer}
            disabled={cardLoading}
            className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-foreground/10 hover:border-foreground/30 transition-colors text-left disabled:opacity-60"
          >
            <div className="w-12 h-12 rounded-2xl bg-foreground/8 flex items-center justify-center shrink-0">
              <RiBankCardLine className="text-foreground/60 h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground font-semibold text-sm">Card / Transfer</p>
              <p className="text-foreground/50 text-xs mt-0.5">
                {cardLoading ? 'Redirecting to payment…' : 'Top up your wallet securely via Paystack'}
              </p>
            </div>
            <RiArrowRightSLine className="text-foreground/30 h-5 w-5 shrink-0" />
          </button>
        </div>
      )}

      {/* ── PIN ── */}
      {step === 'pin' && (
        <>
          <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-5 shrink-0">
              <RiFingerprint2Line className="text-accent h-10 w-10" />
            </div>
            <p className="text-foreground/50 text-sm text-center mb-1">
              Enter your 4-digit transaction PIN to pay from wallet.
            </p>
            <p className="text-accent font-bold text-lg mb-8">{formatCurrency(amount)}</p>
            <PinInput value={pin} onChange={setPin} />
            {wallet?.hasTransactionPin ? (
              <p className="text-foreground/40 text-xs mt-6 text-center">
                Your PIN is encrypted and never stored on this device.
              </p>
            ) : (
              <>
                <p className="text-foreground/50 text-xs mt-6 text-center">You haven't set a transaction PIN yet.</p>
                <button
                  onClick={() => setShowPinModal(true)}
                  className="text-accent text-xs font-semibold mt-2 hover:underline"
                >
                  Set PIN
                </button>
              </>
            )}
          </div>
          <div className="bg-card px-4 pt-4 pb-5 shrink-0">
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={handleConfirmPin}
              disabled={!pinReady || payMutation.isPending || !wallet?.hasTransactionPin}
            >
              Confirm payment
            </Button>
          </div>
          {!wallet?.hasTransactionPin && <PinSetModal open={showPinModal} onOpenChange={setShowPinModal} mode="set" />}
        </>
      )}

      {/* ── Processing ── */}
      {step === 'processing' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          {loaderData ? (
            <Lottie animationData={loaderData} loop className="w-44 h-44" />
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-6" />
          )}
          <p className="text-foreground font-semibold text-base mt-2">Processing your payment…</p>
          <p className="text-foreground/50 text-sm mt-1 text-center">Please don't close this window</p>
        </div>
      )}

      {/* ── Success ── */}
      {step === 'success' && (
        <>
          <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col items-center text-center">
            <Lottie animationData={confettiAnimation} loop autoplay style={{ width: 160, height: 160 }} />
            <p className="text-accent font-bold text-2xl mt-2">{formatCurrency(amount)}</p>
            <p className="text-foreground/50 text-sm mt-2 leading-relaxed">
              Your payment toward <span className="font-semibold text-foreground">{inv.title}</span> was successful.
              {amount < outstanding
                ? ` Remaining balance: ${formatCurrency(outstanding - amount)}.`
                : ' Your plan is now fully paid.'}
            </p>
          </div>
          <div className="bg-card px-4 pt-4 pb-5 shrink-0">
            <Button
              className="w-full h-14 bg-accent hover:bg-accent/90 text-white font-semibold rounded-2xl text-base"
              onClick={onExit}
            >
              View payment details
            </Button>
          </div>
        </>
      )}
    </>
  );
}
