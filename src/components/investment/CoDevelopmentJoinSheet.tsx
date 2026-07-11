import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Lottie from 'lottie-react';
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiWalletLine,
  RiBankCardLine,
  RiArrowRightSLine,
  RiFingerprint2Line,
  RiShieldCheckLine,
  RiToolsLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { api, ApiError } from '@/lib/fetchClient';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { useWallet } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import type { Property, Investment, ApiResponse } from '@/types';

type Step = 'slots' | 'payment' | 'pin' | 'processing';
type PayFrequency = 'daily' | 'weekly' | 'monthly';

const FREQUENCY_INTERVALS: Record<PayFrequency, number[]> = {
  daily: [7, 14, 30],
  weekly: [3, 6, 12],
  monthly: [3, 6, 12],
};

const INTERVAL_LABEL: Record<PayFrequency, (n: number) => string> = {
  daily: (n) => `${n} Days`,
  weekly: (n) => `${n} Weeks`,
  monthly: (n) => `${n} Months`,
};

// ─── 4-box PIN input ──────────────────────────────────────────────────────────

function PinInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const digit = e.target.value.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(4, ' ').split('').slice(0, 4);
    chars[i] = digit || ' ';
    const next = chars.join('').replace(/\s+$/, '');
    onChange(next);
    if (digit && i < 3) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (value[i] && value[i] !== ' ') {
        const chars = value.padEnd(4, ' ').split('');
        chars[i] = ' ';
        onChange(chars.join('').replace(/\s+$/, ''));
      } else if (i > 0) {
        const chars = value.padEnd(4, ' ').split('');
        chars[i - 1] = ' ';
        onChange(chars.join('').replace(/\s+$/, ''));
        refs.current[i - 1]?.focus();
      }
    }
  };

  return (
    <div className="flex gap-3 justify-center">
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i]?.trim() ?? ''}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={cn(
            'w-14 h-14 text-center text-2xl rounded-xl border-2 bg-foreground/5 focus:outline-none transition-colors',
            value[i]?.trim() ? 'border-accent' : 'border-foreground/20 focus:border-accent/60'
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface CoDevelopmentJoinSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property;
  onSuccess: (investment: Investment) => void;
}

export function CoDevelopmentJoinSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: CoDevelopmentJoinSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('slots');
  const [slots, setSlots] = useState(1);
  const [slotsInput, setSlotsInput] = useState('1');
  const [payInstallmentally, setPayInstallmentally] = useState(false);
  const [frequency, setFrequency] = useState<PayFrequency>('weekly');
  const [payInterval, setPayInterval] = useState(6);
  const [pin, setPin] = useState('');
  const [loaderData, setLoaderData] = useState<object | null>(null);
  const [cardLoading, setCardLoading] = useState(false);

  const { wallet } = useWallet();

  // Co-dev config fields
  const config = (property.investmentModelConfig?.config ?? {}) as Record<string, unknown>;
  const pricePerSlot = (config.pricePerSlot as number | undefined) ?? property.minInvestment;
  const availableSlots = property.inventoryAvailable;
  const feesAndLegal = property.managementFees?.total ?? 0;
  const minInstallmentPct = (config.minInstallmentPercent as number | undefined) ?? 30;

  // Current milestone (in-progress stage)
  const currentMilestone = property.milestones?.find(
    (ms) => ms.isCurrentStage || ms.status === 'in_progress'
  );

  // Derived amounts — no preview API for co-dev; amounts come from property config
  const initialCommitment = pricePerSlot * slots;
  const firstPayment = Math.round((initialCommitment * minInstallmentPct) / 100);
  const remainingAfterFirst = initialCommitment - firstPayment;
  const paymentPerInterval = payInterval > 0 ? Math.round(remainingAfterFirst / payInterval) : 0;
  const chargedNow = payInstallmentally
    ? firstPayment + feesAndLegal
    : initialCommitment + feesAndLegal;
  const displayTotal = formatCurrency(chargedNow);

  // Preload Lottie loader
  useEffect(() => {
    if (step === 'processing' && !loaderData) {
      fetch('/lottie-gif/loader.json')
        .then((r) => r.json())
        .then(setLoaderData)
        .catch(() => null);
    }
  }, [step, loaderData]);

  // Reset interval to middle option when frequency changes
  useEffect(() => {
    setPayInterval(FREQUENCY_INTERVALS[frequency][1]);
  }, [frequency]);

  const checkoutMutation = useMutation({
    mutationFn: (payload: {
      propertyId: string;
      quantity: number;
      transactionPin: string;
    }) => api.post<ApiResponse<Investment>>('/investments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
    },
  });

  const resetState = useCallback(() => {
    setStep('slots');
    setSlots(1);
    setSlotsInput('1');
    setPayInstallmentally(false);
    setFrequency('weekly');
    setPayInterval(6);
    setPin('');
  }, []);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v && step === 'processing') return;
      if (!v) resetState();
      onOpenChange(v);
    },
    [onOpenChange, step, resetState]
  );

  const handleBack = () => {
    if (step === 'payment') setStep('slots');
    else if (step === 'pin') setStep('payment');
    else handleOpenChange(false);
  };

  const handleSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setSlotsInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1 && num <= availableSlots) setSlots(num);
  };

  const handleSlotsBlur = () => {
    const num = parseInt(slotsInput, 10);
    if (isNaN(num) || num < 1) { setSlots(1); setSlotsInput('1'); }
    else if (num > availableSlots) { setSlots(availableSlots); setSlotsInput(String(availableSlots)); }
    else { setSlots(num); setSlotsInput(String(num)); }
  };

  const handleCardTransfer = async () => {
    setCardLoading(true);
    try {
      const res = await walletApi.topUp({ amount: chargedNow, paymentMethod: 'card' });
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
    if (pin.replace(/\s/g, '').length < 4) return;
    setStep('processing');
    checkoutMutation.mutate(
      {
        propertyId: property.id,
        quantity: slots,
        transactionPin: pin.replace(/\s/g, ''),
      },
      {
        onSuccess: (res) => {
          const raw = res as unknown as Record<string, unknown>;
          const investment = (raw.data != null ? raw.data : raw) as Investment;
          resetState();
          onOpenChange(false);
          onSuccess(investment);
        },
        onError: (err) => {
          setStep('pin');
          setPin('');
          toast.error(err instanceof ApiError ? err.message : 'Investment failed. Please try again.');
        },
      }
    );
  };

  // ─── Step: Slots ──────────────────────────────────────────────────────────────

  const slotsContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {/* Property card */}
        <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
            {property.primaryImageUrl ? (
              <img src={property.primaryImageUrl} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏗️</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm line-clamp-2 leading-snug">{property.title}</p>
            <div className="flex items-center gap-1 mt-1 text-foreground/50 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
            <p className="text-foreground/50 text-xs mt-1">
              Price Per Slot:{' '}
              <span className="text-emerald-400 font-semibold">{formatCurrency(pricePerSlot)}</span>
            </p>
          </div>
        </div>

        {/* Slots input */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">
            How many slots do you want to invest in?
          </p>
          <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-2xl px-4 py-3">
            <input
              type="text"
              inputMode="numeric"
              value={slotsInput}
              onChange={handleSlotsChange}
              onBlur={handleSlotsBlur}
              className="flex-1 bg-transparent text-foreground font-bold text-2xl focus:outline-none min-w-0"
              placeholder="1"
            />
            <span className="text-foreground/40 text-sm font-medium shrink-0">slots</span>
          </div>
          <p className="text-foreground/40 text-xs mt-1.5 px-1">
            {availableSlots} slot{availableSlots !== 1 ? 's' : ''} available · min. 1
          </p>
        </div>

        {/* Price summary */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl px-4 py-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/50">Price per slot</span>
            <span className="text-foreground font-medium">{formatCurrency(pricePerSlot)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/50">
              {slots} slot{slots !== 1 ? 's' : ''} × {formatCurrency(pricePerSlot)}
            </span>
            <span className="text-emerald-400 font-bold">{formatCurrency(initialCommitment)}</span>
          </div>
        </div>

        {/* Current milestone banner */}
        {currentMilestone && (
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl px-4 py-3 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <RiToolsLine className="text-emerald-400 h-4 w-4" />
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-sm">
                Current milestone: {currentMilestone.title}
              </p>
              <p className="text-foreground/50 text-xs mt-0.5 leading-relaxed">
                Remaining balance is held until the next milestone.
              </p>
            </div>
          </div>
        )}

        {/* Pay installmentally toggle */}
        <button
          onClick={() => setPayInstallmentally((v) => !v)}
          className="flex items-center gap-3 w-full py-1"
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            payInstallmentally
              ? 'bg-emerald-500 border-emerald-500'
              : 'border-foreground/30 bg-transparent'
          )}>
            {payInstallmentally && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <polyline
                  points="2 6 5 9 10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
          <span className="text-foreground text-sm font-medium">Pay installmentally</span>
        </button>

        {/* Breakdown */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-foreground font-semibold text-sm">Breakdown</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">
              {payInstallmentally ? 'First payment' : 'Initial commitment'}
            </span>
            <span className="text-foreground font-medium">
              {formatCurrency(payInstallmentally ? firstPayment : initialCommitment)}
            </span>
          </div>
          {feesAndLegal > 0 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
              <span className="text-foreground/60">Fees & legal processing</span>
              <span className="text-foreground font-medium">{formatCurrency(feesAndLegal)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground font-semibold">Total amount to be charged</span>
            <span className="text-accent font-bold">{formatCurrency(chargedNow)}</span>
          </div>
        </div>

        {/* Installment options — only when checkbox is on */}
        {payInstallmentally && (
          <div className="space-y-4">
            {/* How much now */}
            <div>
              <p className="text-foreground font-medium text-sm mb-2">
                How much do you want to pay now?
              </p>
              <div className="bg-foreground/5 border border-foreground/15 rounded-2xl px-4 py-3 flex items-center justify-between">
                <span className="text-foreground font-bold text-lg">{formatCurrency(firstPayment)}</span>
                <button className="text-emerald-400 text-sm font-semibold">Pay minimum</button>
              </div>
              <p className="text-foreground/40 text-xs mt-1.5 px-1 leading-relaxed">
                Only the minimum {minInstallmentPct}% of your commitment can be paid upfront when
                paying installmentally.
              </p>
            </div>

            {/* Frequency selector */}
            <div>
              <p className="text-foreground font-medium text-sm mb-2">
                How often do you want to pay?
              </p>
              <div className="flex items-center gap-2">
                {(['daily', 'weekly', 'monthly'] as PayFrequency[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFrequency(f)}
                    className={cn(
                      'flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors',
                      frequency === f
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval selector */}
            <div>
              <p className="text-foreground font-medium text-sm mb-2">
                What is your payment interval?
              </p>
              <div className="flex items-center gap-2">
                {FREQUENCY_INTERVALS[frequency].map((n) => (
                  <button
                    key={n}
                    onClick={() => setPayInterval(n)}
                    className={cn(
                      'flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors',
                      payInterval === n
                        ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                        : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                    )}
                  >
                    {INTERVAL_LABEL[frequency](n)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment summary */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
              <p className="text-foreground/70 text-xs leading-relaxed">
                After your first payment, you will pay{' '}
                <span className="text-emerald-400 font-bold">
                  {formatCurrency(paymentPerInterval)} {frequency}
                </span>
                .
              </p>
            </div>

            {/* Co-dev info note */}
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full border border-foreground/30 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-foreground/50 text-[10px] font-bold leading-none">i</span>
              </div>
              <p className="text-foreground/50 text-xs leading-relaxed">
                Co-development payments are released per milestone. You only fund construction
                stages as they are verified.
              </p>
            </div>
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-green-600/15 flex items-center justify-center shrink-0">
            <RiShieldCheckLine className="text-green-400 h-4 w-4" />
          </div>
          <p className="text-foreground/50 text-xs leading-relaxed">
            This is a legally binding co-development agreement. Review all documents before
            proceeding.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
          onClick={() => setStep('payment')}
          disabled={slots < 1 || slots > availableSlots}
        >
          Join project
          <RiArrowRightSLine className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </>
  );

  // ─── Step: Payment method ─────────────────────────────────────────────────────

  const paymentContent = (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
        <span className="text-foreground/50 text-sm">Amount due</span>
        <span className="text-foreground font-bold text-base">{displayTotal}</span>
      </div>

      <button
        onClick={() => setStep('pin')}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-foreground/15 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <RiWalletLine className="text-emerald-400 h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">From my wallet</p>
          <p className="text-foreground/50 text-xs mt-0.5">
            Balance:{' '}
            <span className={cn(
              'font-semibold',
              (wallet?.availableBalance ?? 0) >= chargedNow ? 'text-green-400' : 'text-red-400'
            )}>
              {formatCurrency(wallet?.availableBalance ?? 0)}
            </span>
          </p>
        </div>
        <RiArrowRightSLine className="text-foreground/30 h-5 w-5 shrink-0" />
      </button>

      <button
        onClick={handleCardTransfer}
        disabled={cardLoading}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-foreground/15 hover:border-foreground/30 hover:bg-foreground/5 transition-colors text-left disabled:opacity-60"
      >
        <div className="w-12 h-12 rounded-2xl bg-foreground/8 flex items-center justify-center shrink-0">
          <RiBankCardLine className="text-foreground/60 h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">Card / Transfer</p>
          <p className="text-foreground/50 text-xs mt-0.5">
            {cardLoading ? 'Redirecting to payment…' : 'Pay securely via Paystack'}
          </p>
        </div>
        <RiArrowRightSLine className="text-foreground/30 h-5 w-5 shrink-0" />
      </button>
    </div>
  );

  // ─── Step: PIN ────────────────────────────────────────────────────────────────

  const pinReady = pin.replace(/\s/g, '').length === 4;

  const pinContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-5 shrink-0">
          <RiFingerprint2Line className="text-accent h-10 w-10" />
        </div>
        <h3 className="text-foreground font-bold text-xl mb-2">Confirm Investment</h3>
        <p className="text-foreground/50 text-sm text-center mb-1">
          Enter your 4-digit transaction PIN to pay from wallet.
        </p>
        <p className="text-accent font-bold text-lg mb-8">{displayTotal}</p>
        <PinInput value={pin} onChange={setPin} />
        <p className="text-foreground/30 text-xs mt-6 text-center">
          Your PIN is encrypted and never stored on this device.
        </p>
      </div>
      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleConfirmPin}
          disabled={!pinReady || checkoutMutation.isPending}
        >
          Confirm payment
        </Button>
      </div>
    </>
  );

  // ─── Step: Processing ─────────────────────────────────────────────────────────

  const processingContent = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {loaderData ? (
        <Lottie animationData={loaderData} loop className="w-44 h-44" />
      ) : (
        <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mb-6" />
      )}
      <p className="text-foreground font-semibold text-base mt-2">Processing your investment…</p>
      <p className="text-foreground/40 text-sm mt-1 text-center">Please don't close this window</p>
    </div>
  );

  // ─── Assemble ─────────────────────────────────────────────────────────────────

  const STEP_TITLES: Record<Step, string> = {
    slots: 'Join Project',
    payment: 'How would you want to pay?',
    pin: 'Confirm Investment',
    processing: 'Processing…',
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden',
          isMobile ? 'rounded-t-2xl h-[92vh]' : 'h-full sm:max-w-120'
        )}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <SheetTitle className="sr-only">{STEP_TITLES[step]}</SheetTitle>

          {step !== 'processing' && (
            <div className="px-4 pt-5 pb-3 border-b border-foreground/10 shrink-0 flex items-center gap-3 pr-14">
              <button
                onClick={handleBack}
                className="w-9 h-9 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/60 hover:bg-foreground/15 transition-colors shrink-0"
              >
                <RiArrowLeftLine className="h-4 w-4" />
              </button>
              <p className="text-foreground font-semibold text-sm flex-1 leading-snug">
                {STEP_TITLES[step]}
              </p>
            </div>
          )}

          {step === 'slots' && slotsContent}
          {step === 'payment' && paymentContent}
          {step === 'pin' && pinContent}
          {step === 'processing' && processingContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}
