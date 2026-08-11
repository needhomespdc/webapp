import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Lottie from 'lottie-react';
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiWalletLine,
  RiBankCardLine,
  RiArrowRightSLine,
  RiSubtractLine,
  RiAddLine,
  RiFingerprint2Line,
  RiShieldCheckLine,
} from 'react-icons/ri';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn, formatCurrency } from '@/lib/utils';
import { propertiesApi } from '@/api/properties.api';
import { walletApi } from '@/api/wallet.api';
import { useCheckoutInvestment } from '@/hooks/useInvestment';
import { useWallet } from '@/hooks/useWallet';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';
import { PinSetModal } from '@/components/wallet/PinSetModal';
import type { Property, Investment } from '@/types';

type Step = 'quantity' | 'payment' | 'pin' | 'processing';

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

interface OutrightAcquireSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  property: Property;
  onSuccess: (investment: Investment) => void;
}

export function OutrightAcquireSheet({
  open,
  onOpenChange,
  property,
  onSuccess,
}: OutrightAcquireSheetProps) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [step, setStep] = useState<Step>('quantity');
  const [quantity, setQuantity] = useState(1);
  const [pin, setPin] = useState('');
  const [loaderData, setLoaderData] = useState<object | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const queryClient = useQueryClient();
  const { wallet } = useWallet();
  const checkoutMutation = useCheckoutInvestment();

  const { data: previewResponse, isLoading: previewLoading } = useQuery({
    queryKey: ['outright-preview', property.id, quantity],
    queryFn: () => propertiesApi.outrightCheckoutPreview(property.id, quantity),
    enabled: open,
    staleTime: 30_000,
  });

  const preview = previewResponse;

  // Preload loader animation the first time processing step is entered
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
        setStep('quantity');
        setQuantity(1);
        setPin('');
      }
      onOpenChange(v);
    },
    [onOpenChange, step]
  );

  const handleBack = () => {
    if (step === 'payment') setStep('quantity');
    else if (step === 'pin') setStep('payment');
    else handleOpenChange(false);
  };

  // ─── Card / Transfer ────────────────────────────────────────────────────────

  const handleCardTransfer = async () => {
    const total = preview?.totalPurchasePrice ?? fallbackTotal;
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

  // ─── Wallet + PIN ────────────────────────────────────────────────────────────

  const handleConfirmPin = () => {
    if (pin.replace(/\s/g, '').length < 4) return;
    setStep('processing');
    checkoutMutation.mutate(
      { propertyId: property.id, quantity, transactionPin: pin.replace(/\s/g, '') },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: ['outright-preview', property.id] });
          const raw = res as unknown as Record<string, unknown>;
          const investment = (raw.data != null ? raw.data : raw) as Investment;
          setStep('quantity');
          setPin('');
          setQuantity(1);
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


  // ─── Derived values ──────────────────────────────────────────────────────────

  const fallbackTotal =
    (property.minInvestment + (property.managementFees?.total ?? 0)) * quantity;

  const totalAmount = preview?.totalPurchasePrice ?? fallbackTotal;
  const displayTotal = formatCurrency(totalAmount);

  // Show as soon as quantity hits the threshold — no need to wait for the preview.
  const showDiscountBanner =
    preview?.qualifiesForDiscount === true ||
    quantity >= (preview?.multiUnitDiscountMinQuantity ?? 2);

  // ─── Step: Quantity ──────────────────────────────────────────────────────────

  const quantityContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
        {/* Property summary card */}
        <div className="flex items-center gap-3 bg-foreground/5 border border-foreground/10 rounded-2xl p-3">
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-foreground/10">
            {property.primaryImageUrl ? (
              <img
                src={property.primaryImageUrl}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
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
              <span className="text-accent font-semibold">
                {formatCurrency(preview?.unitPrice ?? property.minInvestment)}
              </span>
            </p>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
          <p className="text-foreground/60 text-xs font-medium mb-3 uppercase tracking-wide">Quantity</p>
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-11 h-11 rounded-full bg-foreground/10 flex items-center justify-center text-foreground/70 hover:bg-foreground/20 transition-colors disabled:opacity-30"
            >
              <RiSubtractLine className="h-5 w-5" />
            </button>
            <div className="text-center flex-1">
              <p className="text-foreground text-2xl font-bold">{quantity}</p>
              <p className="text-foreground/40 text-xs mt-0.5">
                {quantity === 1 ? '1 Unit' : `${quantity} Units`}&nbsp;&middot;&nbsp;
                {preview?.unitsAvailable ?? property.inventoryAvailable} available
              </p>
            </div>
            <button
              onClick={() =>
                setQuantity((q) =>
                  Math.min(preview?.unitsAvailable ?? property.inventoryAvailable, q + 1)
                )
              }
              disabled={quantity >= (preview?.unitsAvailable ?? property.inventoryAvailable)}
              className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-accent hover:bg-accent/25 transition-colors disabled:opacity-30"
            >
              <RiAddLine className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Multi-unit discount banner — shown once user qualifies */}
        {showDiscountBanner && (
          <div className="bg-accent/15 border border-accent/50 rounded-xl px-4 py-3 flex items-center gap-2.5">
            <span className="text-base leading-none shrink-0">✨</span>
            <p className="text-foreground/80 text-xs font-medium">
              You qualify for a{' '}
              <span className="text-accent font-bold">
                {preview?.managementFeeDiscountPercent ?? 0}%
              </span>{' '}
              management fee discount on purchases of{' '}
              {preview?.multiUnitDiscountMinQuantity ?? 2}+ units.
            </p>
          </div>
        )}

        {/* Cost breakdown */}
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-foreground/10">
            <p className="text-foreground font-semibold text-sm">Cost Breakdown</p>
          </div>

          {!preview ? (
            <div className="px-4 py-6 text-center">
              <p className="text-foreground/40 text-sm">Calculating…</p>
            </div>
          ) : (
            <>
              {/* Property price */}
              <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                <span className="text-foreground/60">
                  Property Price ({quantity} unit{quantity > 1 ? 's' : ''})
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency(preview.propertyPrice)}
                </span>
              </div>

              {/* Management fee */}
              {preview.managementFee > 0 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                  <span className="text-foreground/60">Management Fee</span>
                  <span className="text-foreground font-medium">
                    {formatCurrency(preview.managementFee)}
                  </span>
                </div>
              )}

              {/* Discount */}
              {preview.qualifiesForDiscount && preview.managementFeeDiscount > 0 && (
                <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                  <span className="text-foreground/60">
                    Multi-unit Discount ({preview.managementFeeDiscountPercent}%)
                  </span>
                  <span className="text-green-400 font-medium">
                    -{formatCurrency(preview.managementFeeDiscount)}
                  </span>
                </div>
              )}

              {/* Total — straight from the API, no client-side math */}
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-foreground font-bold">Total</span>
                <span className="text-accent font-bold text-base">
                  {formatCurrency(preview.totalPurchasePrice)}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 bg-foreground/5 rounded-xl p-3">
          <div className="w-8 h-8 rounded-full bg-green-600/15 flex items-center justify-center shrink-0">
            <RiShieldCheckLine className="text-green-400 h-4 w-4" />
          </div>
          <p className="text-foreground/50 text-xs leading-relaxed">
            This is a legally binding investment. Review all property documents before proceeding.
          </p>
        </div>
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={() => setStep('payment')}
          disabled={previewLoading || (preview?.unitsAvailable ?? property.inventoryAvailable) < 1}
        >
          Acquire now
          <RiArrowRightSLine className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </>
  );

  // ─── Step: Payment method ────────────────────────────────────────────────────

  const paymentContent = (
    <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3">
      <div className="bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 flex items-center justify-between mb-1">
        <span className="text-foreground/50 text-sm">Amount due</span>
        <span className="text-foreground font-bold text-base">{displayTotal}</span>
      </div>

      {/* From wallet */}
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
            <span
              className={cn(
                'font-semibold',
                (wallet?.availableBalance ?? 0) >= totalAmount ? 'text-green-400' : 'text-red-400'
              )}
            >
              {formatCurrency(wallet?.availableBalance ?? 0)}
            </span>
          </p>
        </div>
        <RiArrowRightSLine className="text-foreground/30 h-5 w-5 shrink-0" />
      </button>

      {/* Card / Transfer */}
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

  // ─── Step: PIN ───────────────────────────────────────────────────────────────

  const pinReady = pin.replace(/\s/g, '').length === 4;

  const pinContent = (
    <>
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-8 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mb-5 shrink-0">
          <RiFingerprint2Line className="text-accent h-10 w-10" />
        </div>
        <h3 className="text-foreground font-bold text-xl mb-2">Confirm Acquisition</h3>
        <p className="text-foreground/50 text-sm text-center mb-1">
          Enter your 4-digit transaction PIN to pay from wallet.
        </p>
        <p className="text-accent font-bold text-lg mb-8">{displayTotal}</p>

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
              className="text-accent text-xs font-semibold mt-2 hover:underline"
            >
              Set PIN
            </button>
          </>
        )}
      </div>

      <div className="px-5 py-4 border-t border-foreground/10 shrink-0">
        <Button
          className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold rounded-xl"
          onClick={handleConfirmPin}
          disabled={!pinReady || checkoutMutation.isPending || !wallet?.hasTransactionPin}
        >
          Confirm payment
        </Button>
      </div>

      {!wallet?.hasTransactionPin && (
        <PinSetModal
          open={showPinModal}
          onOpenChange={setShowPinModal}
          mode="set"
        />
      )}
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
    quantity: 'Acquire Property',
    payment: 'How would you want to pay?',
    pin: 'Confirm Acquisition',
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
          <p className="text-foreground font-semibold text-sm flex-1 leading-snug">
            {STEP_TITLES[step]}
          </p>
        </div>
      )}

      {step === 'quantity' && quantityContent}
      {step === 'payment' && paymentContent}
      {step === 'pin' && pinContent}
      {step === 'processing' && processingContent}
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
