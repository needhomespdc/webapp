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

type Step = 'plots' | 'terms' | 'payment' | 'pin' | 'processing';
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

const TERMS_SECTIONS = [
  {
    title: '1. Investment Confirmation',
    body: 'Your land banking investment is confirmed once full payment has been successfully received and verified.',
  },
  {
    title: '2. Property Documentation',
    body: 'Upon successful payment, your property documents will be issued immediately as proof of your investment.',
  },
  {
    title: '3. Buy-Back Option',
    body: 'A buy-back option allows an investor to sell their investment back to the company under the applicable buy-back terms and conditions.',
  },
  {
    title: '4. Property Resale',
    body: "Investors may resell their property through the platform's Secondary Market. Payment will be made only after another investor successfully purchases the listed property.",
  },
  {
    title: '5. Property Enquiries',
    body: 'For enquiries relating to this property, please contact the Project Manager assigned to the property.',
  },
  {
    title: '6. Instalment Payment Terms',
    body: 'Investors who choose the instalment payment option must make all scheduled payments on or before their selected due dates. The full outstanding balance must be paid by the final payment due date stated in the instalment plan.',
  },
];

// ─── PIN Input ────────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

interface LandBankingReserveSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property;
  onSuccess: (investment: Investment) => void;
}

export function LandBankingReserveSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: LandBankingReserveSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const queryClient = useQueryClient();
  const plotsInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('plots');
  const [plots, setPlots] = useState(1);
  const [plotsInput, setPlotsInput] = useState('1');
  const [payInstallmentally, setPayInstallmentally] = useState(false);
  const [frequency, setFrequency] = useState<PayFrequency>('monthly');
  const [payInterval, setPayInterval] = useState(6);
  const [pin, setPin] = useState('');
  const [loaderData, setLoaderData] = useState<object | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);

  const { wallet } = useWallet();

  // Config fields
  const config = (property.investmentModelConfig?.config ?? {}) as Record<string, unknown>;
  const pricePerPlot =
    (config.pricePerPlot as number | undefined) ?? property.totalPrice ?? property.minInvestment;
  const surveyFee =
    (config.surveyFee as number | undefined) ?? (property.managementFees?.total ?? 0);
  const surveyFeeLabel =
    property.managementFees?.items?.[0]?.label ?? 'Survey Fee';
  const reservationDurations =
    (config.reservationDurations as number[] | undefined) ?? [12, 24, 36];
  const availablePlots = property.inventoryAvailable;

  const [selectedDuration, setSelectedDuration] = useState(
    () => reservationDurations[1] ?? reservationDurations[0] ?? 24
  );

  // Derived amounts
  const plotsTotal = pricePerPlot * plots;
  const totalCommitment = plotsTotal + surveyFee;
  // First payment = full plot price; survey fee is deferred across intervals
  const firstPayment = plotsTotal;
  const remainingAfterFirst = surveyFee;
  const paymentPerInterval = payInterval > 0 ? Math.round(remainingAfterFirst / payInterval) : 0;
  const chargedNow = payInstallmentally ? firstPayment : totalCommitment;
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
      reservationPeriodMonths: number;
    }) => api.post<ApiResponse<Investment>>('/investments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
    },
  });

  const resetState = useCallback(() => {
    setStep('plots');
    setPlots(1);
    setPlotsInput('1');
    setPayInstallmentally(false);
    setFrequency('monthly');
    setPayInterval(6);
    setPin('');
    setTermsAgreed(false);
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
    if (step === 'terms') { setTermsAgreed(false); setStep('plots'); }
    else if (step === 'payment') setStep('terms');
    else if (step === 'pin') setStep('payment');
    else handleOpenChange(false);
  };

  const handlePlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setPlotsInput(raw);
    const num = parseInt(raw, 10);
    if (!isNaN(num) && num >= 1 && num <= availablePlots) setPlots(num);
  };

  const handlePlotsBlur = () => {
    const num = parseInt(plotsInput, 10);
    if (isNaN(num) || num < 1) { setPlots(1); setPlotsInput('1'); }
    else if (num > availablePlots) { setPlots(availablePlots); setPlotsInput(String(availablePlots)); }
    else { setPlots(num); setPlotsInput(String(num)); }
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
        quantity: plots,
        transactionPin: pin.replace(/\s/g, ''),
        reservationPeriodMonths: selectedDuration,
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

  // ─── Step: Plots ──────────────────────────────────────────────────────────────

  const plotsContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {/* Property card */}
        <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
            {property.primaryImageUrl ? (
              <img
                src={property.primaryImageUrl}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏞️</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm line-clamp-2 leading-snug">
              {property.title}
            </p>
            <div className="flex items-center gap-1 mt-1 text-foreground/50 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
            <p className="text-foreground/50 text-xs mt-1">
              Price Per Plot:{' '}
              <span className="text-accent font-semibold">{formatCurrency(pricePerPlot)}</span>
            </p>
          </div>
        </div>

        {/* Plots input */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">
            How many plots do you want to reserve?
          </p>
          <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-2xl px-4 py-3">
            <input
              ref={plotsInputRef}
              type="text"
              inputMode="numeric"
              value={plotsInput}
              onChange={handlePlotsChange}
              onBlur={handlePlotsBlur}
              className="flex-1 bg-transparent text-foreground font-bold text-2xl focus:outline-none min-w-0"
              placeholder="1"
            />
            <span className="text-foreground/40 text-sm font-medium shrink-0">plots</span>
          </div>
          <p className="text-foreground/40 text-xs mt-1.5 px-1">
            {availablePlots} plot{availablePlots !== 1 ? 's' : ''} available · min. 1
          </p>
        </div>

        {/* Reservation duration */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">
            How long do you want to reserve this land?
          </p>
          <div className="flex items-center gap-2">
            {reservationDurations.map((months) => (
              <button
                key={months}
                onClick={() => setSelectedDuration(months)}
                className={cn(
                  'flex-1 py-2.5 rounded-full text-sm font-semibold border transition-colors',
                  selectedDuration === months
                    ? 'border-accent bg-accent text-white'
                    : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                )}
              >
                {months} Months
              </button>
            ))}
          </div>
        </div>

        {/* Pay installmentally toggle */}
        <button
          onClick={() => setPayInstallmentally((v) => !v)}
          className="flex items-center gap-3 w-full py-1"
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
            payInstallmentally
              ? 'bg-accent border-accent'
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
              {payInstallmentally ? 'First payment' : 'Plot reservation'}
            </span>
            <span className="text-foreground font-medium">
              {formatCurrency(payInstallmentally ? firstPayment : plotsTotal)}
            </span>
          </div>
          {surveyFee > 0 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
              <span className="text-foreground/60">{surveyFeeLabel}</span>
              <span className="text-foreground font-medium">{formatCurrency(surveyFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground font-semibold">Total amount to be charged</span>
            <span className="text-accent font-bold">{formatCurrency(totalCommitment)}</span>
          </div>
        </div>

        {/* Installment options */}
        {payInstallmentally && (
          <div className="space-y-4">
            <div>
              <p className="text-foreground font-medium text-sm mb-2">
                How much do you want to pay now?
              </p>
              <div className="bg-foreground/5 border border-foreground/15 rounded-2xl px-4 py-3">
                <span className="text-foreground font-bold text-lg">{formatCurrency(firstPayment)}</span>
              </div>
              <button
                onClick={() => plotsInputRef.current?.focus()}
                className="text-accent text-sm font-semibold mt-1.5 px-1"
              >
                Can I reserve more plots?
              </button>
            </div>

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
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                    )}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

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
                        ? 'border-accent text-accent bg-accent/10'
                        : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                    )}
                  >
                    {INTERVAL_LABEL[frequency](n)}
                  </button>
                ))}
              </div>
            </div>

            {remainingAfterFirst > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3">
                <p className="text-foreground/70 text-xs leading-relaxed">
                  After your first payment, you will pay{' '}
                  <span className="text-accent font-bold">
                    {formatCurrency(paymentPerInterval)} {frequency}
                  </span>
                  .
                </p>
              </div>
            )}
          </div>
        )}

        {/* Security note */}
        <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-green-600/15 flex items-center justify-center shrink-0">
            <RiShieldCheckLine className="text-green-400 h-4 w-4" />
          </div>
          <p className="text-foreground/50 text-xs leading-relaxed">
            This is a legally binding land banking investment. Review all property documents
            before proceeding.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={() => setStep('terms')}
          disabled={plots < 1 || plots > availablePlots}
        >
          Buy now
          <RiArrowRightSLine className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </>
  );

  // ─── Step: Terms & Conditions ─────────────────────────────────────────────────

  const termsContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {TERMS_SECTIONS.map((s) => (
          <div key={s.title}>
            <p className="text-foreground font-semibold text-sm mb-1">{s.title}</p>
            <p className="text-foreground/60 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0 space-y-4">
        <button
          onClick={() => setTermsAgreed((v) => !v)}
          className="flex items-start gap-3 w-full text-left"
        >
          <div className={cn(
            'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
            termsAgreed ? 'bg-accent border-accent' : 'border-foreground/30 bg-transparent'
          )}>
            {termsAgreed && (
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
          <span className="text-foreground text-sm leading-relaxed">
            I have read and agree to these Terms &amp; Conditions.
          </span>
        </button>

        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl disabled:opacity-40"
          disabled={!termsAgreed}
          onClick={() => setStep('payment')}
        >
          Accept &amp; Continue
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
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-foreground/15 hover:border-accent/50 hover:bg-accent/5 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-accent/15 flex items-center justify-center shrink-0">
          <RiWalletLine className="text-accent h-6 w-6" />
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
        <div className="w-16 h-16 rounded-full border-4 border-accent border-t-transparent animate-spin mb-6" />
      )}
      <p className="text-foreground font-semibold text-base mt-2">Processing your investment…</p>
      <p className="text-foreground/40 text-sm mt-1 text-center">Please don't close this window</p>
    </div>
  );

  // ─── Assemble ─────────────────────────────────────────────────────────────────

  const STEP_TITLES: Record<Step, string> = {
    plots: 'Reserve Plot',
    terms: 'Terms & Conditions',
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

          {step === 'plots' && plotsContent}
          {step === 'terms' && termsContent}
          {step === 'payment' && paymentContent}
          {step === 'pin' && pinContent}
          {step === 'processing' && processingContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}
