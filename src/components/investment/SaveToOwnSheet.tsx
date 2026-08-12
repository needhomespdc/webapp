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
  RiInformationLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { api, ApiError } from '@/lib/fetchClient';
import { walletApi } from '@/api/wallet.api';
import { queryKeys } from '@/lib/queryKeys';
import { useWallet } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { PinSetModal } from '@/components/wallet/PinSetModal';
import type { Property, Investment, ApiResponse } from '@/types';

type Step = 'savings' | 'terms' | 'payment' | 'pin' | 'processing';
type PayFrequency = 'daily' | 'weekly' | 'monthly';

const TERMS_SECTIONS = [
  {
    title: '1. Ownership',
    body: 'Property ownership documents will be issued upon completion of all scheduled payments. You are entitled to the property only after the full purchase price and fees have been received and confirmed.',
  },
  {
    title: '2. Resale',
    body: "Investors may list their savings position for resale only after full payment has been completed, through the platform's Secondary Market. Partial resale of an in-progress Save-to-Own plan is not permitted.",
  },
  {
    title: '3. Buy-Back Option',
    body: 'A buy-back option allows an investor to sell their investment back to the company under applicable buy-back terms. Contact support to initiate a buy-back request.',
  },
  {
    title: '4. Payment Duration Extension',
    body: 'Investors who need additional time to complete their payment may request a duration extension through the app. An administrative fee may apply, and all extensions are subject to approval.',
  },
  {
    title: '5. Payment Schedule',
    body: 'You are required to adhere to the payment frequency and amount you select at the time of investment. Failure to maintain the agreed schedule may result in plan suspension.',
  },
  {
    title: '6. Default',
    body: 'Late or missed payments may incur penalty charges and could result in forfeiture of accrued units if the account remains delinquent beyond the grace period outlined in your investment terms.',
  },
];

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
            value[i]?.trim() ? 'border-blue-500' : 'border-foreground/20 focus:border-blue-500/60'
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

interface SaveToOwnSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property;
  onSuccess: (investment: Investment) => void;
}

export function SaveToOwnSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: SaveToOwnSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('savings');
  const [savingsAmountInput, setSavingsAmountInput] = useState('');
  const [frequency, setFrequency] = useState<PayFrequency>('monthly');
  const [selectedDuration, setSelectedDuration] = useState(6);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [pin, setPin] = useState('');
  const [loaderData, setLoaderData] = useState<object | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [showMoreInfoSheet, setShowMoreInfoSheet] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const { wallet } = useWallet();

  const config = (property.investmentModelConfig?.config ?? {}) as Record<string, unknown>;
  const pricePerUnit =
    (config.pricePerUnit as number | undefined) ?? property.totalPrice ?? property.minInvestment;
  const legalFee =
    (config.legalFee as number | undefined) ?? (property.managementFees?.total ?? 0);
  const legalFeeLabel =
    property.managementFees?.items?.[0]?.label ?? 'Legal Fee';
  const durationOptions =
    (config.durationOptions as number[] | undefined) ??
    (config.reservationDurations as number[] | undefined) ??
    [3, 6, 12];

  useEffect(() => {
    if (durationOptions.length > 0) {
      setSelectedDuration(durationOptions[Math.floor(durationOptions.length / 2)] ?? durationOptions[0]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPayable = pricePerUnit + legalFee;
  const displaySavingsAmount = savingsAmountInput ? parseInt(savingsAmountInput, 10).toLocaleString('en-NG') : '';
  const savingsAmount = Math.min(
    Math.max(0, parseInt(savingsAmountInput, 10) || 0),
    totalPayable
  );
  const remaining = totalPayable - savingsAmount;
  const intervalCount = selectedDuration;
  const paymentPerInterval = intervalCount > 0 ? Math.round(remaining / intervalCount) : 0;
  const chargedNow = savingsAmount;
  const displayTotal = formatCurrency(chargedNow);

  useEffect(() => {
    if (step === 'processing' && !loaderData) {
      fetch('/lottie-gif/loader.json')
        .then((r) => r.json())
        .then(setLoaderData)
        .catch(() => null);
    }
  }, [step, loaderData]);

  const checkoutMutation = useMutation({
    mutationFn: (payload: {
      propertyId: string;
      quantity: number;
      transactionPin: string;
      savingsAmount?: number;
      paymentFrequency?: string;
      paymentDurationMonths?: number;
    }) => api.post<ApiResponse<Investment>>('/investments', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
    },
  });

  const resetState = useCallback(() => {
    setStep('savings');
    setSavingsAmountInput('');
    setFrequency('monthly');
    setSelectedDuration(durationOptions[Math.floor(durationOptions.length / 2)] ?? durationOptions[0] ?? 6);
    setTermsAgreed(false);
    setPin('');
  }, [durationOptions]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v && step === 'processing') return;
      if (!v) resetState();
      onOpenChange(v);
    },
    [onOpenChange, step, resetState]
  );

  const handleBack = () => {
    if (step === 'terms') { setTermsAgreed(false); setStep('savings'); }
    else if (step === 'payment') setStep('terms');
    else if (step === 'pin') setStep('payment');
    else handleOpenChange(false);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/\D/g, '');
    setSavingsAmountInput(raw);
  };

  const handleCardTransfer = async () => {
    if (chargedNow <= 0) { toast.error('Please enter an amount to save now.'); return; }
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
        quantity: 1,
        transactionPin: pin.replace(/\s/g, ''),
        savingsAmount: chargedNow > 0 ? chargedNow : undefined,
        paymentFrequency: frequency,
        paymentDurationMonths: selectedDuration,
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

  // ─── Step: Savings ────────────────────────────────────────────────────────────

  const savingsContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {/* Property card */}
        <div className="flex items-center gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
            {property.primaryImageUrl ? (
              <img src={property.primaryImageUrl} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏡</div>
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
              Price per unit:{' '}
              <span className="text-blue-500 font-semibold">{formatCurrency(pricePerUnit)}</span>
            </p>
          </div>
        </div>

        {/* Amount input */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">
            How much do you want to save now?
          </p>
          <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/15 rounded-2xl px-4 py-3">
            <span className="text-foreground/50 text-lg font-semibold shrink-0">₦</span>
            <input
              type="text"
              inputMode="numeric"
              value={displaySavingsAmount}
              onChange={handleAmountChange}
              placeholder="0"
              className="flex-1 bg-transparent text-foreground font-bold text-2xl focus:outline-none min-w-0"
            />
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-foreground/40 text-xs">Up to {formatCurrency(totalPayable)}</p>
            <button
              onClick={() => setShowMoreInfoSheet(true)}
              className="flex items-center gap-1 text-blue-500 text-xs font-semibold"
            >
              <RiInformationLine className="h-3.5 w-3.5" />
              Can I save more than this?
            </button>
          </div>
        </div>

        {/* Frequency selector */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">How often do you want to pay?</p>
          <div className="flex items-center gap-2">
            {(['daily', 'weekly', 'monthly'] as PayFrequency[]).map((f) => (
              <button
                key={f}
                onClick={() => setFrequency(f)}
                className={cn(
                  'flex-1 py-2.5 rounded-full text-sm font-medium border transition-colors',
                  frequency === f
                    ? 'border-blue-500 text-blue-500 bg-blue-500/10'
                    : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Duration selector */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">Select savings duration</p>
          <div className="flex items-center gap-2">
            {durationOptions.map((months) => (
              <button
                key={months}
                onClick={() => setSelectedDuration(months)}
                className={cn(
                  'flex-1 py-2.5 rounded-full text-sm font-semibold border transition-colors',
                  selectedDuration === months
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-foreground/20 text-foreground/50 hover:border-foreground/40'
                )}
              >
                {months} Months
              </button>
            ))}
          </div>
        </div>

        {/* After-first-payment info */}
        {remaining > 0 && (
          <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3">
            <p className="text-foreground/70 text-xs leading-relaxed">
              After your first payment, you will pay{' '}
              <span className="text-blue-500 font-bold">
                {formatCurrency(paymentPerInterval)} {frequency}
              </span>{' '}
              for {selectedDuration} months.
            </p>
          </div>
        )}

        {/* Breakdown */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-foreground font-semibold text-sm">Breakdown</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">Price per unit</span>
            <span className="text-foreground font-medium">{formatCurrency(pricePerUnit)}</span>
          </div>
          {legalFee > 0 && (
            <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
              <span className="text-foreground/60">{legalFeeLabel}</span>
              <span className="text-foreground font-medium">{formatCurrency(legalFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">Total payable</span>
            <span className="text-foreground font-semibold">{formatCurrency(totalPayable)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">First payment</span>
            <span className="text-foreground font-medium">{formatCurrency(savingsAmount)}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground font-bold">Amount to pay now</span>
            <span className="text-blue-500 font-bold text-base">{formatCurrency(savingsAmount)}</span>
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-green-600/15 flex items-center justify-center shrink-0">
            <RiShieldCheckLine className="text-green-400 h-4 w-4" />
          </div>
          <p className="text-foreground/50 text-xs leading-relaxed">
            This is a legally binding Save-to-Own commitment. Review all property documents before proceeding.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
          onClick={() => setStep('terms')}
          disabled={savingsAmount <= 0}
        >
          Start saving
          <RiArrowRightSLine className="h-5 w-5 ml-1" />
        </Button>
      </div>

      {/* "Can I save more?" info dialog */}
      <Dialog open={showMoreInfoSheet} onOpenChange={setShowMoreInfoSheet}>
        <DialogContent className="max-w-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0">
            <RiInformationLine className="text-blue-500 h-7 w-7" />
          </div>
          <div className="space-y-2">
            <p className="text-foreground font-bold text-base">Can I save more than this?</p>
            <p className="text-foreground/60 text-sm leading-relaxed">
              Yes, absolutely! You can save any amount up to the total payable ({formatCurrency(totalPayable)},
              which covers the unit price and all applicable fees). Anything extra you pay now goes toward
              your plan and reduces future payments.
            </p>
          </div>
          <Button
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
            onClick={() => setShowMoreInfoSheet(false)}
          >
            Got it
          </Button>
        </DialogContent>
      </Dialog>
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
          <div
            className={cn(
              'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
              termsAgreed ? 'bg-blue-500 border-blue-500' : 'border-foreground/30 bg-transparent'
            )}
          >
            {termsAgreed && (
              <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                <polyline points="2 6 5 9 10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-foreground text-sm leading-relaxed">
            I have read and agree to these Terms &amp; Conditions.
          </span>
        </button>

        <Button
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl disabled:opacity-40"
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
      <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
        <span className="text-foreground/50 text-sm">Amount due</span>
        <span className="text-blue-500 font-bold text-base">{displayTotal}</span>
      </div>

      <button
        onClick={() => setStep('pin')}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-foreground/15 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center shrink-0">
          <RiWalletLine className="text-blue-500 h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">From my wallet</p>
          <p className="text-foreground/50 text-xs mt-0.5">
            Balance:{' '}
            <span className={cn('font-semibold', (wallet?.availableBalance ?? 0) >= chargedNow ? 'text-green-400' : 'text-red-400')}>
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
        <div className="w-20 h-20 rounded-full bg-blue-500/15 flex items-center justify-center mb-5 shrink-0">
          <RiFingerprint2Line className="text-blue-500 h-10 w-10" />
        </div>
        <h3 className="text-foreground font-bold text-xl mb-2">Confirm Payment</h3>
        <p className="text-foreground/50 text-sm text-center mb-1">
          Enter your 4-digit transaction PIN to pay from wallet.
        </p>
        <p className="text-blue-500 font-bold text-lg mb-8">{displayTotal}</p>

        <PinInput value={pin} onChange={setPin} />

        {wallet?.hasTransactionPin ? (
          <p className="text-foreground/30 text-xs mt-6 text-center">
            Your PIN is encrypted and never stored on this device.
          </p>
        ) : (
          <>
            <p className="text-foreground/40 text-xs mt-6 text-center">
              You haven't set a transaction PIN yet.
            </p>
            <button
              onClick={() => setShowPinModal(true)}
              className="text-blue-500 text-xs font-semibold mt-2 hover:underline"
            >
              Set PIN
            </button>
          </>
        )}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl"
          onClick={handleConfirmPin}
          disabled={!pinReady || checkoutMutation.isPending || !wallet?.hasTransactionPin}
        >
          Confirm payment
        </Button>
      </div>

      {!wallet?.hasTransactionPin && (
        <PinSetModal open={showPinModal} onOpenChange={setShowPinModal} mode="set" />
      )}
    </>
  );

  // ─── Step: Processing ─────────────────────────────────────────────────────────

  const processingContent = (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      {loaderData ? (
        <Lottie animationData={loaderData} loop className="w-44 h-44" />
      ) : (
        <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mb-6" />
      )}
      <p className="text-foreground font-semibold text-base mt-2">Processing your investment…</p>
      <p className="text-foreground/40 text-sm mt-1 text-center">Please don't close this window</p>
    </div>
  );

  // ─── Assemble ─────────────────────────────────────────────────────────────────

  const STEP_TITLES: Record<Step, string> = {
    savings: 'Save to Own',
    terms: 'Terms & Conditions',
    payment: 'How would you want to pay?',
    pin: 'Confirm Payment',
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

          {step === 'savings' && savingsContent}
          {step === 'terms' && termsContent}
          {step === 'payment' && paymentContent}
          {step === 'pin' && pinContent}
          {step === 'processing' && processingContent}
        </div>
      </SheetContent>
    </Sheet>
  );
}
