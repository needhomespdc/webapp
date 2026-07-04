import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMapPinLine,
  RiHeartLine,
  RiHeartFill,
  RiShareLine,
  RiCheckLine,
  RiAlertLine,
  RiDownload2Line,
  RiFileTextLine,
  RiBuildingLine,
  RiShieldCheckLine,
  RiToolsLine,
  RiCarLine,
  RiFlashlightLine,
  RiStarLine,
  RiLineChartLine,
  RiImageLine,
  RiCloseLine,
} from 'react-icons/ri';
import { partnersApi } from '@/api/partners.api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyBySlug } from '@/hooks/useProperty';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
// import { useCheckoutInvestment } from '@/hooks/useInvestment';
import { Loader } from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
// import { ApiError } from '@/lib/fetchClient';
import type { Property, Milestone } from '@/types';

// ─── Icon map for property highlights ─────────────────────────────────────────

const HIGHLIGHT_ICON: Record<string, ReactNode> = {
  map_pin: <RiMapPinLine className="h-4 w-4" />,
  wrench: <RiToolsLine className="h-4 w-4" />,
  building: <RiBuildingLine className="h-4 w-4" />,
  shield_check: <RiShieldCheckLine className="h-4 w-4" />,
  sparkles: <RiFlashlightLine className="h-4 w-4" />,
  car: <RiCarLine className="h-4 w-4" />,
  star: <RiStarLine className="h-4 w-4" />,
  high_roi: <RiLineChartLine className="h-4 w-4" />,
};

// ─── Model badge colors (matches PropertyCard) ────────────────────────────────

const MODEL_BADGE_COLOR: Record<string, string> = {
  co_development: 'bg-emerald-500',
  fractional: 'bg-violet-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  outright: 'bg-amber-500',
};

// ─── Per-model CTA config ─────────────────────────────────────────────────────

const MODEL_CTA: Record<string, { priceLabel: string; btnText: string; btnClass: string; unitLabel: string }> = {
  co_development: { priceLabel: 'Price per Slot', btnText: 'Join Project', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white', unitLabel: 'Slots' },
  fractional:     { priceLabel: 'Minimum Investment', btnText: 'Invest Now', btnClass: 'bg-violet-500 hover:bg-violet-600 text-white', unitLabel: 'Units' },
  land_banking:   { priceLabel: 'Minimum Plot Investment', btnText: 'Buy Now', btnClass: 'bg-accent hover:bg-accent/90 text-white', unitLabel: 'Plots' },
  save_to_own:    { priceLabel: 'Minimum First Payment', btnText: 'Save Now', btnClass: 'bg-blue-500 hover:bg-blue-600 text-white', unitLabel: 'Units' },
  outright:       { priceLabel: 'Total Purchase Price', btnText: 'Acquire Now', btnClass: 'bg-accent hover:bg-accent/90 text-white', unitLabel: 'Units' },
};

// ─── Milestone status badge ───────────────────────────────────────────────────

function MilestoneBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-600/15 text-green-400">Completed</span>;
  if (status === 'in_progress')
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent">In Progress</span>;
  return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-foreground/10 text-foreground/40">Upcoming</span>;
}

// ─── Co-Development section ───────────────────────────────────────────────────

function CoDevSection({ property, config }: { property: Property; config: Record<string, unknown> }) {
  const slots = config.coDeveloperSlots as number | undefined;
  const remaining = config.slotsRemaining as number | undefined;
  const duration = config.projectDuration as string | undefined;
  const paymentModel = config.paymentModel as string | undefined;
  const milestones = (property.milestones ?? [])
    .slice()
    .sort((a: Milestone, b: Milestone) => (a.sortOrder ?? a.order ?? 0) - (b.sortOrder ?? b.order ?? 0));

  return (
    <>
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-foreground/10">
          <h2 className="text-foreground font-semibold text-sm">Co-Development Overview</h2>
        </div>
        {duration && (
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">Project Duration</span>
            <span className="text-foreground font-medium">{duration}</span>
          </div>
        )}
        {slots != null && remaining != null && (
          <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
            <span className="text-foreground/60">Co-Developer Slots</span>
            <span className="text-foreground font-medium">{remaining} of {slots} left</span>
          </div>
        )}
        {paymentModel && (
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-foreground/60">Payment Model</span>
            <span className="text-foreground font-semibold tracking-wide text-xs uppercase">{paymentModel}</span>
          </div>
        )}
      </div>

      {milestones.length > 0 && (
        <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
          <h2 className="text-foreground font-semibold text-sm mb-0.5">Development Milestones</h2>
          <p className="text-foreground/40 text-xs mb-4">Your contribution is released per milestone as construction progresses.</p>
          <div className="space-y-4">
            {milestones?.filter((ms) => ms.isCurrentStage).map((ms) => (
              <div key={ms.id} className="flex items-start gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold',
                  ms.status === 'completed' ? 'bg-green-600/20 text-green-400'
                    : ms.status === 'in_progress' ? 'bg-accent/20 text-accent'
                    : 'bg-foreground/10 text-foreground/40'
                )}>
                  {ms.status === 'completed'
                    ? <RiCheckLine className="h-4 w-4" />
                    : (ms.stepNumber ?? (ms.sortOrder != null ? ms.sortOrder + 1 : 1))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-foreground text-sm font-medium">{ms.title}</p>
                    <MilestoneBadge status={ms.status} />
                  </div>
                  {ms.subtitle && <p className="text-foreground/50 text-xs mt-0.5 line-clamp-2">{ms.subtitle}</p>}
                  {ms.targetDate && <p className="text-foreground/40 text-xs mt-1">{formatDate(ms.targetDate)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Fractional section ───────────────────────────────────────────────────────

function FractionalSection({ config }: { config: Record<string, unknown> }) {
  const items = [
    { label: 'Expected return', value: (config.expectedRoiRange ?? config.expectedReturn) as string | undefined },
    { label: 'Payout cycle', value: (config.payoutCycle ?? config.payoutFrequency ?? 'At maturity') as string },
    { label: 'Investment window',
      value: (config.investmentWindowStart && config.investmentWindowEnd)
        ? `${formatDate(config.investmentWindowStart as string)} – ${formatDate(config.investmentWindowEnd as string)}`
        : config.investmentWindow as string | undefined },
    { label: 'Investment ends', value: config.maturityDate ? formatDate(config.maturityDate as string) : config.investmentEnds as string | undefined },
  ].filter((i): i is { label: string; value: string } => !!i.value);

  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="bg-foreground/5 border border-foreground/10 rounded-2xl p-3">
          <p className="text-foreground/50 text-xs mb-1">{item.label}</p>
          <p className="text-accent font-semibold text-sm">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Land Banking section ─────────────────────────────────────────────────────

function LandBankingSection({ property, config }: { property: Property; config: Record<string, unknown> }) {
  const pricePerPlot = (config.pricePerPlot as number | undefined) ?? property.totalPrice ?? property.minInvestment;
  const hasBuyback = (config.hasBuyback ?? config.guaranteedExit) as boolean | undefined;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Available Plots', value: String(property.inventoryAvailable) },
    { label: 'Price Per Plot', value: formatCurrency(pricePerPlot) },
    ...(hasBuyback != null ? [{ label: 'Buy-Back Option (Guaranteed Exit)', value: hasBuyback ? 'Yes' : 'No' }] : []),
  ];

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn('flex items-center justify-between px-4 py-3 text-sm', i < rows.length - 1 && 'border-b border-foreground/10')}
        >
          <span className="text-foreground/60">{row.label}</span>
          <span className="text-foreground font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Outright section ─────────────────────────────────────────────────────────

function OutrightSection({ property }: { property: Property }) {
  const unitPrice = property.totalPrice ?? property.minInvestment;
  const mgmtFee = property.managementFees?.total ?? 0;
  const totalPurchase = unitPrice + mgmtFee;

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-foreground/10">
        <h2 className="text-foreground font-semibold text-sm">Cost Breakdown</h2>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
        <span className="text-foreground/60">Property cost (per unit)</span>
        <span className="text-foreground">{formatCurrency(unitPrice)}</span>
      </div>
      {mgmtFee > 0 && (
        <div className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
          <span className="text-foreground/60">Management fee</span>
          <span className="text-foreground">{formatCurrency(mgmtFee)}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-foreground font-semibold">Total purchase price</span>
        <span className="text-foreground font-bold">{formatCurrency(totalPurchase)}</span>
      </div>
    </div>
  );
}

// ─── Save-to-Own section ──────────────────────────────────────────────────────

function SaveToOwnSection({ property, config }: { property: Property; config: Record<string, unknown> }) {
  const totalPrice = property.totalPrice ?? property.minInvestment;
  const minPct = config.minInstallmentPercent as number | undefined;
  const minFirstPayment = minPct ? (totalPrice * minPct) / 100 : property.minInvestment;
  const tenure = config.tenureMonths as number | undefined;

  const rows: Array<{ label: string; value: string }> = [
    { label: 'Property Value', value: formatCurrency(totalPrice) },
    { label: 'Minimum First Payment', value: formatCurrency(minFirstPayment) },
    ...(tenure ? [{ label: 'Tenure', value: `${tenure} months` }] : []),
  ];

  return (
    <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-foreground/10">
        <h2 className="text-foreground font-semibold text-sm">Savings Plan</h2>
      </div>
      {rows.map((row, i) => (
        <div key={row.label} className={cn('flex items-center justify-between px-4 py-3 text-sm', i < rows.length - 1 && 'border-b border-foreground/10')}>
          <span className="text-foreground/60">{row.label}</span>
          <span className="text-foreground font-medium">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Fullscreen Lightbox ──────────────────────────────────────────────────────

interface LightboxProps {
  images: { url: string; secureUrl?: string; altText?: string | null }[];
  index: number;
  onClose: () => void;
}

function Lightbox({ images, index, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(index);

  const prev = useCallback(() => setCurrent((c) => (c - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setCurrent((c) => (c + 1) % images.length), [images.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  const src = images[current]?.secureUrl ?? images[current]?.url ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none"
      onClick={onClose}
    >
      {/* Close */}
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <RiCloseLine className="h-5 w-5" />
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
          {current + 1} / {images.length}
        </span>
      )}

      {/* Image */}
      <img
        src={src}
        alt={images[current]?.altText ?? ''}
        className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            <RiArrowLeftSLine className="h-6 w-6" />
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            <RiArrowRightSLine className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Dot nav */}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
              className={cn(
                'rounded-full transition-all',
                idx === current ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/30'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // const [investOpen, setInvestOpen] = useState(false);
  // const [quantity, setQuantity] = useState(1);
  // const [pin, setPin] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);

  const { property, isLoading } = usePropertyBySlug(slug);
  const { favoriteIds } = useFavoriteIds();
  const isFav = favoriteIds.includes(property?.id ?? '');

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && property) {
      partnersApi.trackReferralEvent({
        referralCode: ref,
        eventType: 'click',
        propertySlug: property.slug,
        propertyTitle: property.title,
        channel: 'direct',
      }).catch(() => null);
    }
  }, [searchParams, property]);

  const toggleFavMutation = useToggleFavorite();
  // const investMutation = useCheckoutInvestment();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: property?.title, url }).catch(() => null);
    } else {
      navigator.clipboard.writeText(url).then(() => toast.success('Link copied!'));
    }
  };

  // const handleInvest = () => {
  //   investMutation.mutate(
  //     { propertyId: property!.id, quantity, transactionPin: pin },
  //     {
  //       onSuccess: () => {
  //         toast.success('Investment successful!');
  //         setInvestOpen(false);
  //         navigate('/investor/portfolio');
  //       },
  //       onError: (err: unknown) => {
  //         toast.error(err instanceof ApiError ? err.message : 'Investment failed. Please try again.');
  //       },
  //     }
  //   );
  // };

  if (isLoading) return <Loader fullPage />;
  if (!property) return null;

  const images = property.images?.length
    ? property.images
    : property.primaryImageUrl
    ? [{ id: 'primary', url: property.primaryImageUrl, secureUrl: property.primaryImageUrl, publicId: '', isPrimary: true }]
    : [];
  const currentImageUrl = images[selectedImage]?.secureUrl ?? images[selectedImage]?.url ?? '';

  const config = (property.investmentModelConfig?.config ?? {}) as Record<string, unknown>;
  const kycApproved = user?.kycStatus === 'approved';
  const isAvailable = property.status === 'published' && property.inventoryAvailable > 0;
  const ctaConfig = MODEL_CTA[property.investmentModelType] ?? MODEL_CTA.fractional;

  const ctaPrice = (() => {
    if (property.investmentModelType === 'outright') {
      return (property.totalPrice ?? property.minInvestment) + (property.managementFees?.total ?? 0);
    }
    if (property.investmentModelType === 'co_development') {
      return (config.pricePerSlot as number | undefined) ?? property.minInvestment;
    }
    return property.totalPrice ?? property.minInvestment;
  })();

  const descParagraphs = (property.description ?? '').split(/<br\s*\/?>/gi).filter(Boolean);
  const longDesc = (property.description?.length ?? 0) > 250;

  return (
    <div className="pb-28 -mx-4 sm:mx-0">
      {/* ── Image gallery ──────────────────────────────────────────────────── */}
      {images.length > 0 ? (
        <div>
          <div className="relative h-72 overflow-hidden sm:rounded-2xl bg-foreground/5">
            <img
              src={currentImageUrl}
              alt={property.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

            {/* Sold Out stamp */}
            {property.inventoryAvailable === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="rotate-[-25deg] border-4 border-red-500 text-red-500 text-3xl font-black tracking-widest px-4 py-1 rounded-md opacity-80 select-none">
                  SOLD OUT
                </span>
              </div>
            )}

            {/* Top: back / heart / share */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="w-9 h-9 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white"
              >
                <RiArrowLeftLine className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleFavMutation.mutate(
                    { propertyId: property.id, isFavorited: isFav },
                    { onError: () => toast.error('Failed to update favorites') }
                  )}
                  className="w-9 h-9 bg-black/40 backdrop-blur rounded-full flex items-center justify-center"
                >
                  {isFav
                    ? <RiHeartFill className="h-4 w-4 text-accent" />
                    : <RiHeartLine className="h-4 w-4 text-white" />}
                </button>
                <button
                  onClick={handleShare}
                  className="w-9 h-9 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white"
                >
                  <RiShareLine className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Bottom: model badge / image count */}
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
              <span className={cn(
                'flex items-center gap-1.5 text-white text-[10px] font-semibold px-2.5 py-1 rounded-xl',
                MODEL_BADGE_COLOR[property.investmentModelType] ?? 'bg-black/60'
              )}>
                <RiBuildingLine className="h-3 w-3" />
                {property.investmentModelTypeLabel === 'Co-development' ? 'Co-Dev' : property.investmentModelTypeLabel}
              </span>
              {images.length > 1 && (
                <span className="flex items-center gap-1 text-white text-[10px] font-medium bg-black/40 backdrop-blur px-2 py-1 rounded-lg">
                  <RiImageLine className="h-3 w-3" />
                  {selectedImage + 1}/{images.length}
                </span>
              )}
            </div>
          </div>

          {/* Dot pagination */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 py-2.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={cn(
                    'rounded-full transition-all',
                    idx === selectedImage ? 'w-5 h-2 bg-accent' : 'w-2 h-2 bg-foreground/20'
                  )}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="h-72 bg-foreground/5 flex items-center justify-center text-foreground/20 text-5xl">🏠</div>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-0 space-y-4 mt-4">

        {/* Title + location */}
        <div>
          <h1 className="text-xl font-bold text-foreground">{property.title}</h1>
          <div className="flex items-center gap-1 mt-1 text-foreground/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0 text-accent" />
            <span>{property.location}</span>
          </div>
        </div>

        {/* Description */}
        {descParagraphs.length > 0 && (
          <div>
            <div className={cn(!descExpanded && 'line-clamp-4')}>
              {descParagraphs.map((para, i) => (
                <p key={i} className="text-foreground/70 text-sm leading-relaxed mb-1">{para}</p>
              ))}
            </div>
            {longDesc && (
              <button onClick={() => setDescExpanded(!descExpanded)} className="text-accent text-sm font-medium mt-0.5">
                {descExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* ── Model-specific section ──────────────────────────────────────── */}
        {property.investmentModelType === 'co_development' && (
          <CoDevSection property={property} config={config} />
        )}
        {property.investmentModelType === 'fractional' && (
          <FractionalSection config={config} />
        )}
        {property.investmentModelType === 'land_banking' && (
          <LandBankingSection property={property} config={config} />
        )}
        {property.investmentModelType === 'outright' && (
          <OutrightSection property={property} />
        )}
        {property.investmentModelType === 'save_to_own' && (
          <SaveToOwnSection property={property} config={config} />
        )}

        {/* ── Property Highlights ─────────────────────────────────────────── */}
        {(property.highlights?.length ?? 0) > 0 && (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
            <h2 className="text-foreground font-semibold text-sm mb-3">Property Highlights</h2>
            <div className="grid grid-cols-2 gap-y-3 gap-x-2">
              {property.highlights!.map((h) => (
                <div key={h.label} className="flex items-center gap-2 text-sm text-foreground/70">
                  <span className="text-foreground/40 shrink-0">
                    {HIGHLIGHT_ICON[h.iconKey] ?? <RiStarLine className="h-4 w-4" />}
                  </span>
                  {h.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── How It Works ───────────────────────────────────────────────── */}
        {property.howItWorksTitle && (property.howItWorksSteps?.length ?? 0) > 0 && (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
            <h2 className="text-foreground font-semibold text-sm mb-3">{property.howItWorksTitle}</h2>
            <div className="space-y-3">
              {property.howItWorksSteps!.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">{step.title}</p>
                    <p className="text-foreground/50 text-xs mt-0.5">{step.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Management Fees ─────────────────────────────────────────────── */}
        {(property.managementFees?.items.length ?? 0) > 0 && (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-foreground/10">
              <h2 className="text-foreground font-semibold text-sm">Management Fees</h2>
            </div>
            {property.managementFees!.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3 text-sm border-b border-foreground/10">
                <span className="text-foreground/60">{item.label}</span>
                <span className="text-foreground">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-foreground font-semibold">Total Management Fees</span>
              <span className="text-foreground font-bold">{formatCurrency(property.managementFees!.total)}</span>
            </div>
          </div>
        )}

        {/* ── Documents + Building Permit ─────────────────────────────────── */}
        {((property.documents?.length ?? 0) > 0 || property.buildingPermitNumber) && (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
              <h2 className="text-foreground font-semibold text-sm">Property Title Documents</h2>
              <span className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold">
                {property.documents?.length ?? 0}
              </span>
            </div>

            {property.documents?.map((doc) => (
              <a
                key={doc.id}
                href={doc.secureUrl ?? doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 px-4 py-3 hover:bg-foreground/5 transition-colors border-b border-foreground/10"
              >
                <RiFileTextLine className="text-accent h-5 w-5 shrink-0" />
                <span className="text-foreground/80 text-sm flex-1">{doc.fileName ?? doc.name ?? 'Document'}</span>
                <RiDownload2Line className="text-foreground/40 h-4 w-4 shrink-0" />
              </a>
            ))}

            {property.buildingPermitNumber && (
              <div className="px-4 py-3">
                <p className="text-foreground/50 text-xs mb-1.5">Building Permit Number</p>
                <div className="bg-accent/10 border border-accent/20 rounded-xl px-3 py-2">
                  <p className="text-accent text-sm font-medium">{property.buildingPermitNumber}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* KYC inline warning */}
        {!kycApproved && isAvailable && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
            <RiAlertLine className="text-amber-400 h-5 w-5 shrink-0" />
            <p className="text-amber-400 text-sm flex-1">Complete KYC to invest.</p>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-black"
              onClick={() => navigate('/investor/kyc')}
            >
              Complete KYC
            </Button>
          </div>
        )}
      </div>

      {/* ── Sticky CTA bar ─────────────────────────────────────────────────── */}
      {property.inventoryAvailable > 0 && <div className="fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3">
        <div className="max-w-screen-sm mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-foreground/50 text-xs truncate">{ctaConfig.priceLabel}</p>
            <p className="text-foreground font-bold text-lg leading-tight">{formatCurrency(ctaPrice)}</p>
          </div>
          {!isAvailable ? (
            <Button disabled className="rounded-full px-6 bg-foreground/10 text-foreground/40 border-0 shrink-0">
              {property.status === 'sold_out' ? 'Sold Out' : 'Window Closed'}
            </Button>
          ) : !kycApproved ? (
            <Button
              onClick={() => navigate('/investor/kyc')}
              className="rounded-full px-6 bg-amber-500 hover:bg-amber-600 text-black shrink-0"
            >
              Complete KYC
            </Button>
          ) : (
            <Button
              // onClick={() => setInvestOpen(true)}
              className={cn('rounded-full px-6 shrink-0', ctaConfig.btnClass)}
            >
              {ctaConfig.btnText}
              <RiArrowRightSLine className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>}

      {/* ── Lightbox ───────────────────────────────────────────────────────── */}
      {lightboxOpen && images.length > 0 && (
        <Lightbox
          images={images}
          index={selectedImage}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* ── Invest dialog (commented out) ────────────────────────────────────── */}
      {/* <Dialog open={investOpen} onOpenChange={setInvestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ctaConfig.btnText} — {property.title}</DialogTitle>
            <DialogDescription>
              Choose the number of {ctaConfig.unitLabel.toLowerCase()} and confirm with your transaction PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of {ctaConfig.unitLabel}</Label>
              <Input
                type="number"
                min={1}
                max={property.inventoryAvailable}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="bg-foreground/5 border border-foreground/10 rounded-xl p-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">Price per {ctaConfig.unitLabel.slice(0, -1).toLowerCase()}</span>
                <span className="text-foreground">{formatCurrency(ctaPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-foreground/60">{ctaConfig.unitLabel}</span>
                <span className="text-foreground">× {quantity}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-1.5 border-t border-foreground/10 mt-0.5">
                <span className="text-foreground">Total</span>
                <span className="text-accent">{formatCurrency(ctaPrice * quantity)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction PIN</Label>
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestOpen(false)}>Cancel</Button>
            <Button onClick={handleInvest} disabled={investMutation.isPending || pin.length < 4}>
              {investMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
