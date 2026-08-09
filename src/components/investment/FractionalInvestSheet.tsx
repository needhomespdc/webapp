import { useState, useRef, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  RiTimeLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { walletApi } from '@/api/wallet.api';
import { useCheckoutInvestment } from '@/hooks/useInvestment';
import { useWallet } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { PinSetModal } from '@/components/wallet/PinSetModal';
import { queryKeys } from '@/lib/queryKeys';
import type { Property, Investment } from '@/types';

type Step = 'details' | 'payment' | 'pin' | 'processing';

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
            value[i]?.trim() ? 'border-violet-500' : 'border-foreground/20 focus:border-violet-500/60'
          )}
          autoComplete="off"
        />
      ))}
    </div>
  );
}

// ─── "Can I buy more shares?" dialog ─────────────────────────────────────────

function MoreSharesDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm rounded-2xl p-6 flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-violet-500/15 flex items-center justify-center shrink-0">
          <RiInformationLine className="h-7 w-7 text-violet-500" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-foreground font-bold text-base">Can I buy more shares?</h3>
          <p className="text-foreground/60 text-sm leading-relaxed">
            Yes — you can purchase additional shares at any time while slots are still available. Simply return to this property and invest again. Each new purchase adds to your portfolio and increases your monthly returns accordingly.
          </p>
        </div>
        <Button
          className="w-full h-11 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl"
          onClick={onClose}
        >
          Got it
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface FractionalInvestSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property;
  onSuccess: (investment: Investment) => void;
}

export function FractionalInvestSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: FractionalInvestSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [step, setStep] = useState<Step>('details');
  const [sharesInput, setSharesInput] = useState('1');
  const [pin, setPin] = useState('');
  const [loaderData, setLoaderData] = useState<object | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showMoreShares, setShowMoreShares] = useState(false);

  const queryClient = useQueryClient();
  const { wallet } = useWallet();
  const checkoutMutation = useCheckoutInvestment();

  // Derive config values
  const config = (property.investmentModelConfig?.config ?? {}) as Record<string, unknown>;
  const pricePerShare = (config.pricePerShare as number | undefined) ?? property.minInvestment;
  const minShares = Math.max(1, (config.minShares as number | undefined) ?? 1);
  const availableShares = (config.availableShares as number | undefined) ?? property.inventoryAvailable;
  const holdingPeriodEnd = (config.holdingPeriodEnd as string | undefined);
  const expectedRoi = (config.expectedRoiRange ?? config.expectedReturn) as string | number | undefined;
  const mgmtFeeTotal = property.managementFees?.total ?? 0;
  const mgmtFeeItems = property.managementFees?.items ?? [];

  // Quantity derived from text input
  const quantity = Math.max(minShares, Math.min(availableShares, parseInt(sharesInput, 10) || minShares));

  // Breakdown (share investment is quantity × price per share from config; fees from backend)
  const shareInvestment = pricePerShare * quantity;
  const total = shareInvestment + mgmtFeeTotal;

  // ROI projection (₦ amount from API-provided %) — display only, not for any calculation
  const roiAmount = (() => {
    if (typeof expectedRoi === 'number') return shareInvestment * (expectedRoi / 100);
    // If it's a string like "8%" parse the number
    const parsed = typeof expectedRoi === 'string' ? parseFloat(expectedRoi) : NaN;
    return isNaN(parsed) ? null : shareInvestment * (parsed / 100);
  })();
  const roiPercent = (() => {
    if (typeof expectedRoi === 'number') return expectedRoi;
    if (typeof expectedRoi === 'string') return parseFloat(expectedRoi) || null;
    return null;
  })();

  useEffect(() => {
    if (step === 'processing' && !loaderData) {
      fetch('/lottie-gif/loader.json')
        .then((r) => r.json())
        .then(setLoaderData)
        .catch(() => null);
    }
  }, [step, loaderData]);

  const handleOpenChange = useCallback(
    (v: boolean) => {
      if (!v && step === 'processing') return;
      if (!v) {
        setStep('details');
        setSharesInput('1');
        setPin('');
      }
      onOpenChange(v);
    },
    [onOpenChange, step]
  );

  const handleBack = () => {
    if (step === 'payment') setStep('details');
    else if (step === 'pin') setStep('payment');
    else handleOpenChange(false);
  };

  const handleCardTransfer = async () => {
    setCardLoading(true);
    try {
      const res = await walletApi.topUp({ amount: total, paymentMethod: 'card' });
      const url = res.payment?.authorizationUrl;
      if (url) {
        window.location.href = url;
      } else {
        toast.error('Could not initiate payment. Please try again.');
      }
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
      { propertyId: property.id, quantity, transactionPin: pin.replace(/\s/g, '') },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.investments.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.wallet.me });
          const raw = res as unknown as Record<string, unknown>;
          const investment = (raw.data != null ? raw.data : raw) as Investment;
          setStep('details');
          setSharesInput('1');
          setPin('');
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

  const canProceed = quantity >= minShares && availableShares > 0;

  // ─── Step: Details ────────────────────────────────────────────────────────────

  const detailsContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {/* Property card */}
        <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
            {property.primaryImageUrl ? (
              <img src={property.primaryImageUrl} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-semibold text-sm line-clamp-2 leading-snug">{property.title}</p>
            <div className="flex items-center gap-1 mt-1 text-foreground/50 text-xs">
              <RiMapPinLine className="h-3 w-3 shrink-0" />
              <span className="truncate">{property.location}</span>
            </div>
            <p className="text-foreground/50 text-xs mt-1">
              Price per share:{' '}
              <span className="text-violet-500 font-semibold">{formatCurrency(pricePerShare)}</span>
            </p>
          </div>
        </div>

        {/* Shares input */}
        <div>
          <p className="text-foreground font-medium text-sm mb-2">How long do you want to invest?</p>
          <div className="flex items-center bg-foreground/5 border border-foreground/10 rounded-xl overflow-hidden">
            <input
              type="number"
              inputMode="numeric"
              min={minShares}
              max={availableShares}
              value={sharesInput}
              onChange={(e) => setSharesInput(e.target.value)}
              onBlur={() => {
                const v = parseInt(sharesInput, 10);
                if (isNaN(v) || v < minShares) setSharesInput(String(minShares));
                else if (v > availableShares) setSharesInput(String(availableShares));
                else setSharesInput(String(v));
              }}
              className="flex-1 bg-transparent text-foreground text-base px-4 py-3 outline-none min-w-0"
            />
            <span className="text-foreground/40 text-sm px-4 shrink-0 border-l border-foreground/10 py-3">
              Shares
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-foreground/50 text-xs">
              {availableShares} shares available. min {minShares}
            </p>
            <button
              type="button"
              onClick={() => setShowMoreShares(true)}
              className="text-violet-500 text-xs font-medium hover:underline"
            >
              can i buy more shares?
            </button>
          </div>
        </div>

        {/* Expected return */}
        {roiPercent != null && (
          <div className="text-sm text-foreground/60">
            Expected return of{' '}
            <span className="text-green-500 font-semibold">{roiPercent}%</span>{' '}
            {roiAmount != null && (
              <>
                project to{' '}
                <span className="text-green-500 font-semibold">{formatCurrency(roiAmount)}</span>{' '}
              </>
            )}
            on this investment.
          </div>
        )}

        {/* Holding period */}
        {holdingPeriodEnd && (
          <div className="flex items-center justify-between bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-foreground/60">
              <RiTimeLine className="h-4 w-4 shrink-0" />
              <span>Holding period ends</span>
            </div>
            <span className="text-foreground font-semibold">{formatDate(holdingPeriodEnd)}</span>
          </div>
        )}

        {/* Note box */}
        <div className="bg-violet-500/8 border border-violet-500/25 rounded-xl p-4">
          <p className="text-foreground font-semibold text-sm mb-2">Note:</p>
          <ul className="space-y-1.5 list-disc list-outside pl-4">
            {[
              'Full wallet payment is required upfront for fractional investments',
              'You can purchase additional shares while slots remain available.',
              'Returns are paid on a monthly cycle based on your shares.',
              'Early exit is available before duration ends (5% fee applies)',
            ].map((note) => (
              <li key={note} className="text-foreground/70 text-xs leading-relaxed">
                {note}
              </li>
            ))}
          </ul>
        </div>

        {/* Breakdown */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-foreground font-semibold text-sm">Breakdown</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">Share investment</span>
            <span className="text-foreground font-medium">{formatCurrency(shareInvestment)}</span>
          </div>
          {mgmtFeeItems.length > 0
            ? mgmtFeeItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                  <span className="text-foreground/60">{item.label}</span>
                  <span className="text-foreground font-medium">{formatCurrency(item.amount)}</span>
                </div>
              ))
            : mgmtFeeTotal > 0 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                  <span className="text-foreground/60">Agent fee</span>
                  <span className="text-foreground font-medium">{formatCurrency(mgmtFeeTotal)}</span>
                </div>
              )}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground font-semibold">Total amount to be charged</span>
            <span className="text-accent font-bold text-base">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl"
          onClick={() => setStep('payment')}
          disabled={!canProceed}
        >
          Invest Now
          <RiArrowRightSLine className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </>
  );

  // ─── Step: Payment ────────────────────────────────────────────────────────────

  const paymentContent = (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
        <span className="text-foreground/50 text-sm">Amount due</span>
        <span className="text-foreground font-bold text-base">{formatCurrency(total)}</span>
      </div>

      <button
        onClick={() => setStep('pin')}
        className="w-full flex items-center gap-4 p-4 rounded-2xl border border-foreground/15 hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors text-left"
      >
        <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0">
          <RiWalletLine className="text-violet-500 h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-semibold text-sm">From my wallet</p>
          <p className="text-foreground/50 text-xs mt-0.5">
            Balance:{' '}
            <span className={cn('font-semibold', (wallet?.availableBalance ?? 0) >= total ? 'text-green-400' : 'text-red-400')}>
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
        <div className="w-20 h-20 rounded-full bg-violet-500/15 flex items-center justify-center mb-5 shrink-0">
          <RiFingerprint2Line className="text-violet-500 h-10 w-10" />
        </div>
        <h3 className="text-foreground font-bold text-xl mb-2">Confirm Investment</h3>
        <p className="text-foreground/50 text-sm text-center mb-1">
          Enter your 4-digit transaction PIN to pay from wallet.
        </p>
        <p className="text-violet-500 font-bold text-lg mb-8">{formatCurrency(total)}</p>

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
              className="text-violet-500 text-xs font-semibold mt-2 hover:underline"
            >
              Set PIN
            </button>
          </>
        )}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl"
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
        <div className="w-16 h-16 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mb-6" />
      )}
      <p className="text-foreground font-semibold text-base mt-2">Processing your investment…</p>
      <p className="text-foreground/40 text-sm mt-1 text-center">Please don't close this window</p>
    </div>
  );

  // ─── Assemble ─────────────────────────────────────────────────────────────────

  const STEP_TITLES: Record<Step, string> = {
    details: 'Invest Now',
    payment: 'How would you like to pay?',
    pin: 'Confirm Investment',
    processing: 'Processing…',
  };

  const content = (
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
          <p className="text-foreground font-semibold text-sm flex-1 leading-snug">{STEP_TITLES[step]}</p>
        </div>
      )}

      {step === 'details' && detailsContent}
      {step === 'payment' && paymentContent}
      {step === 'pin' && pinContent}
      {step === 'processing' && processingContent}

      <MoreSharesDialog open={showMoreShares} onClose={() => setShowMoreShares(false)} />
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={cn(
          'p-0 flex flex-col overflow-hidden',
          isMobile ? 'rounded-t-2xl h-[92vh]' : 'h-full sm:max-w-120'
        )}
      >
        {content}
      </SheetContent>
    </Sheet>
  );
}
