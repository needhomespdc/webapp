import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  RiFullscreenLine,
  RiHistoryLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiMapPinLine,
  RiHeartLine,
  RiHeartFill,
  RiShareLine,
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
  RiCloseLine,
  RiPhoneLine,
  RiFileCopy2Line,
  RiWhatsappFill,
  RiFacebookFill,
  RiLinkedinFill,
  RiTwitterXFill,
  RiMailFill,
} from 'react-icons/ri';
import { partnersApi } from '@/api/partners.api';
import { formatCurrency, formatDate, whatsappLink } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyBySlug } from '@/hooks/useProperty';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
// import { useCheckoutInvestment } from '@/hooks/useInvestment';
import { Loader } from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
// import { ApiError } from '@/lib/fetchClient';
import { OutrightAcquireSheet } from '@/components/investment/OutrightAcquireSheet';
import { CoDevelopmentJoinSheet } from '@/components/investment/CoDevelopmentJoinSheet';
import { LandBankingReserveSheet } from '@/components/investment/LandBankingReserveSheet';
import { SaveToOwnSheet } from '@/components/investment/SaveToOwnSheet';
import { FractionalInvestSheet } from '@/components/investment/FractionalInvestSheet';
import { InvestmentSuccessModal } from '@/components/investment/InvestmentSuccessModal';
import type { Property, Milestone, Investment } from '@/types';

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

// Banner pills (Figma, Nov 2026): solid colour per model, outright in white
const MODEL_BADGE_COLOR: Record<string, string> = {
  co_development: 'bg-emerald-700 text-white',
  fractional: 'bg-violet-800 text-white',
  land_banking: 'bg-orange-600 text-white',
  save_to_own: 'bg-blue-600 text-white',
  outright: 'bg-white text-foreground',
};

// ─── Per-model CTA config ─────────────────────────────────────────────────────

const MODEL_CTA: Record<string, { priceLabel: string; btnText: string; btnClass: string; unitLabel: string }> = {
  co_development: { priceLabel: 'Price per slot', btnText: 'Join Project', btnClass: 'bg-emerald-500 hover:bg-emerald-600 text-white', unitLabel: 'Slots' },
  fractional: { priceLabel: 'Price per slot', btnText: 'Invest Now', btnClass: 'bg-violet-500 hover:bg-violet-600 text-white', unitLabel: 'Units' },
  land_banking: { priceLabel: 'Price per plot', btnText: 'Buy Now', btnClass: 'bg-accent hover:bg-accent/90 text-white', unitLabel: 'Plots' },
  save_to_own: { priceLabel: 'Price per plot', btnText: 'Save Now', btnClass: 'bg-blue-500 hover:bg-blue-600 text-white', unitLabel: 'Units' },
  outright: { priceLabel: 'Price per unit', btnText: 'Acquire Now', btnClass: 'bg-accent hover:bg-accent/90 text-white', unitLabel: 'Units' },
};

// ─── Share modal ─────────────────────────────────────────────────────────────

const SOCIALS = [
  {
    label: 'WhatsApp',
    icon: RiWhatsappFill,
    bg: 'bg-[#25D366]',
    href: (url: string, title: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + url)}`,
  },
  {
    label: 'X',
    icon: RiTwitterXFill,
    bg: 'bg-black',
    href: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    label: 'Facebook',
    icon: RiFacebookFill,
    bg: 'bg-[#1877F2]',
    href: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: RiLinkedinFill,
    bg: 'bg-[#0A66C2]',
    href: (url: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: RiMailFill,
    bg: 'bg-[#EA4335]',
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
] as const;

function ShareModal({
  open,
  onOpenChange,
  url,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-foreground/10">
          <DialogTitle className="text-base font-semibold text-foreground">Share Property</DialogTitle>
        </DialogHeader>

        <div className="px-5 py-5 space-y-5">
          {/* Social icons row */}
          <div className="flex items-center justify-center gap-4">
            {SOCIALS.map(({ label, icon: Icon, bg, href }) => (
              <a
                key={label}
                href={href(url, title)}
                // mailto: must open in the same tab, or the browser shows a blank tab instead of the mail app.
                target={label === 'Email' ? undefined : '_blank'}
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-1.5"
                onClick={() => onOpenChange(false)}
              >
                <span className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white text-xl', bg)}>
                  <Icon />
                </span>
                <span className="text-[10px] text-foreground/50">{label}</span>
              </a>
            ))}
          </div>

          <div className="border-t border-foreground/10" />

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 mx-auto text-accent font-semibold text-sm"
          >
            <RiFileCopy2Line className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared section pieces (Figma, Nov 2026) ─────────────────────────────────

const CARD = 'bg-card rounded-3xl p-4';
type InfoRow = { label: string; value: ReactNode };

const longDate = (d: string) => formatDate(d, { day: 'numeric', month: 'long', year: 'numeric' });
const monthName = (d: string) => formatDate(d, { month: 'long' });

/** "19 days" under two months, else "4 months" */
function durationLabel(from?: unknown, to?: unknown): string | undefined {
  if (typeof from !== 'string' || typeof to !== 'string') return undefined;
  const days = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
  if (days <= 0) return undefined;
  if (days < 60) return `${days} day${days !== 1 ? 's' : ''}`;
  const months = Math.round(days / 30.44);
  return `${months} month${months !== 1 ? 's' : ''}`;
}

/** Titled card of label | value rows with dividers */
function InfoCard({ title, rows }: { title: string; rows: InfoRow[] }) {
  if (!rows.length) return null;
  return (
    <div className={CARD}>
      <h2 className="text-foreground font-semibold text-sm mb-1">{title}</h2>
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn(
            'flex items-center justify-between gap-4 py-3 text-sm',
            i < rows.length - 1 && 'border-b border-foreground/10',
          )}
        >
          <span className="text-foreground/50">{row.label}</span>
          <span className="text-foreground text-right">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Base price, the management fee items, then the total in an orange row */
function CostBreakdown({
  property,
  priceLabel,
  price,
  title = 'Cost Breakdown',
  totalLabel = 'Total purchase price',
}: {
  property: Property;
  priceLabel: string;
  price: number;
  title?: string | null;
  totalLabel?: string;
}) {
  const fees = property.managementFees?.items ?? [];
  return (
    <div className={CARD}>
      {title && <h2 className="text-foreground font-semibold text-sm mb-1">{title}</h2>}
      <div className="flex items-center justify-between gap-4 py-3 text-sm">
        <span className="text-foreground/50">{priceLabel}</span>
        <span className="text-foreground">{formatCurrency(price)}</span>
      </div>
      {fees.length > 0 && (
        <>
          <p className="bg-foreground/[0.07] rounded-lg px-2 py-1.5 text-sm font-medium text-foreground">Management fee</p>
          {fees.map((item, i) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center justify-between gap-4 py-3 text-sm',
                i < fees.length - 1 && 'border-b border-foreground/10',
              )}
            >
              <span className="text-foreground/50">{item.label}</span>
              <span className="text-foreground">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </>
      )}
      <div className="flex items-center justify-between gap-4 mt-1 bg-accent/10 rounded-lg px-2 py-2 text-sm">
        <span className="text-foreground font-medium">{totalLabel}</span>
        <span className="text-accent font-bold text-base">{formatCurrency(purchaseTotal(property, price))}</span>
      </div>
    </div>
  );
}

/** Price plus the property's management fees */
function purchaseTotal(property: Property, price: number) {
  return price + (property.managementFees?.total ?? 0);
}

// ─── Per-model detail cards ───────────────────────────────────────────────────
// Land size per plot is on the designs but the backend doesn't store it yet (Nov 2026).

function LandBankingOverview({ property, config }: { property: Property; config: Record<string, unknown> }) {
  const hasBuyback = config.hasBuyBackOption as boolean | undefined;
  return (
    <InfoCard
      title="Overview"
      rows={[
        { label: 'Available Plots', value: String(property.inventoryAvailable) },
        { label: 'Price Per Plot', value: formatCurrency(config.pricePerPlot as number) },
        ...(hasBuyback != null ? [{ label: 'Buy-back option', value: hasBuyback ? 'Yes' : 'No' }] : []),
      ]}
    />
  );
}

function SaveToOwnOverview({ property }: { property: Property }) {
  return <InfoCard title="Overview" rows={[{ label: 'Available Plots', value: String(property.inventoryAvailable) }]} />;
}

function CoDevOverview({ property, config }: { property: Property; config: Record<string, unknown> }) {
  const start = property.projectStartDate ?? (config.projectStartDate as string | undefined);
  const end = property.projectEndDate ?? (config.projectEndDate as string | undefined);
  const rows: InfoRow[] = [];
  if (start && end) rows.push({ label: 'Investment Duration', value: `${longDate(start)} - ${longDate(end)}` });
  if (end) rows.push({ label: 'Project End Date', value: longDate(end) });
  if (config.projectDuration) rows.push({ label: 'Project Duration', value: String(config.projectDuration) });
  if (config.coDeveloperSlots != null) rows.push({ label: 'Co-Developer Slots', value: String(config.coDeveloperSlots) });
  return <InfoCard title="Overview" rows={rows} />;
}

function FractionalDetails({
  property,
  config,
  isWindowClosed,
}: {
  property: Property;
  config: Record<string, unknown>;
  isWindowClosed: boolean;
}) {
  const start = (config.investmentWindowStart as string | undefined) ?? property.investmentWindowStart ?? undefined;
  const end = (config.investmentWindowEnd as string | undefined) ?? property.investmentWindowEnd ?? undefined;
  const notOpenYet = !!start && Date.now() < new Date(start).getTime();
  const holding = durationLabel(end, config.holdingPeriodEnd);
  const duration = durationLabel(end, config.investmentDurationEnd);

  const rows: InfoRow[] = [{ label: 'Total Slots', value: String(config.totalShares ?? property.inventoryTotal) }];
  if (start && end) {
    rows.push({ label: 'Offer Period', value: `${monthName(start)} - ${monthName(end)}` });
    rows.push({ label: 'Investment Window', value: `${longDate(start)} - ${longDate(end)}` });
  }
  if (holding) rows.push({ label: 'Holding Period', value: holding });
  if (duration) rows.push({ label: 'Investment Duration', value: duration });
  rows.push({ label: 'Minimum Slots to buy', value: String(config.minShares ?? 1) });
  rows.push({
    label: 'Status',
    value: (
      <span
        className={cn(
          'text-xs px-2 py-0.5 rounded-md',
          isWindowClosed
            ? 'bg-red-500/10 text-red-600 dark:text-red-400'
            : notOpenYet
              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              : 'bg-green-500/10 text-green-600 dark:text-green-400',
        )}
      >
        {isWindowClosed ? 'Window Closed' : notOpenYet ? 'Opening Soon' : 'Window Open'}
      </span>
    ),
  });
  return <InfoCard title="Investment Details" rows={rows} />;
}

/** Co-development: the current stage, on the right under the video */
function DevelopmentMilestones({ milestones }: { milestones: Milestone[] }) {
  const sorted = [...milestones].sort(
    (a, b) => (a.stepNumber ?? a.sortOrder ?? a.order ?? 0) - (b.stepNumber ?? b.sortOrder ?? b.order ?? 0),
  );
  const current = sorted.find((m) => m.isCurrentStage) ?? sorted.find((m) => m.status !== 'completed');
  if (!current) return null;
  const statusLabel = current.status === 'completed' ? 'Completed' : current.status === 'in_progress' ? 'In progress' : 'Upcoming';
  return (
    <div className={CARD}>
      <h2 className="text-foreground font-semibold text-sm">Development Milestones</h2>
      <p className="text-foreground/50 text-xs mt-1">
        Your contribution is released per milestone as construction progresses.
      </p>
      <div className="flex items-start gap-2 mt-3">
        <RiHistoryLine className="h-4 w-4 text-foreground/40 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-foreground font-semibold text-sm">{current.title}</p>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-md shrink-0',
                current.status === 'completed'
                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                  : current.status === 'in_progress'
                    ? 'bg-accent/10 text-accent'
                    : 'bg-foreground/10 text-foreground/60',
              )}
            >
              {statusLabel}
            </span>
          </div>
          {current.targetDate && <p className="text-foreground/50 text-xs mt-1">{formatDate(current.targetDate)}</p>}
          {(current.description ?? current.subtitle) && (
            <p className="text-foreground/50 text-xs leading-relaxed mt-2">{current.description ?? current.subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Property Video ───────────────────────────────────────────────────────────

function PropertyVideoCard({ url }: { url: string }) {
  const youtubeId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/)?.[1];
  const vimeoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
  const embedUrl = youtubeId
    ? `https://www.youtube.com/embed/${youtubeId}`
    : vimeoId
      ? `https://player.vimeo.com/video/${vimeoId}`
      : null;

  return (
    <div className={CARD}>
      <h2 className="text-foreground font-semibold text-sm mb-3">Property Video</h2>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="w-full aspect-video rounded-2xl"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={url} controls playsInline className="w-full aspect-video rounded-2xl bg-black" />
      )}
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const arrivedWithInvest = useRef(searchParams.get('invest') === 'true');
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // const [investOpen, setInvestOpen] = useState(false);
  // const [quantity, setQuantity] = useState(1);
  // const [pin, setPin] = useState('');
  const [acquireOpen, setAcquireOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [successInvestment, setSuccessInvestment] = useState<Investment | null>(null);

  const { property, isLoading } = usePropertyBySlug(slug);
  const { favoriteIds } = useFavoriteIds();
  const isFav = favoriteIds.includes(property?.id ?? '');

  useEffect(() => {
    const ref = searchParams.get('ref');
    const token = searchParams.get('t');
    if ((ref || token) && property) {
      partnersApi.trackReferralEvent({
        ...(token ? { trackingToken: token } : { referralCode: ref! }),
        eventType: 'click',
        propertySlug: property.slug,
        propertyTitle: property.title,
        channel: 'direct',
      }).catch(() => null);
    }
  }, [searchParams, property]);

  useEffect(() => {
    if (
      searchParams.get('invest') === 'true' &&
      (
        property?.investmentModelType === 'outright' ||
        property?.investmentModelType === 'co_development' ||
        property?.investmentModelType === 'land_banking'
      )
    ) {
      setAcquireOpen(true);
    }
  }, [searchParams, property]);

  const toggleFavMutation = useToggleFavorite();
  // const investMutation = useCheckoutInvestment();

  const handleShare = () => setShareOpen(true);

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

  const windowClosingDate = (() => {
    const raw =
      config.closingDate ??
      config.windowClosesAt ??
      config.investmentWindowEnd ??
      config.reservationEndsAt;
    return raw ? new Date(raw as string) : null;
  })();
  const isWindowClosed = windowClosingDate != null && Date.now() > windowClosingDate.getTime();

  const isAvailable = property.status === 'published' && property.inventoryAvailable > 0 && !isWindowClosed;
  const ctaConfig = MODEL_CTA[property.investmentModelType] ?? MODEL_CTA.fractional;

  // As on the designs (Nov 2026): outright, land banking and save-to-own show the total
  // purchase price (fees in); co-development and fractional show the base slot price
  const ctaPrice = (() => {
    switch (property.investmentModelType) {
      case 'outright':
        return purchaseTotal(property, property.minInvestment);
      case 'land_banking':
        return purchaseTotal(property, config.pricePerPlot as number);
      case 'save_to_own':
        return purchaseTotal(property, (config.propertyPrice as number | undefined) ?? property.minInvestment);
      case 'co_development':
        return (config.pricePerSlot as number | undefined) ?? property.minInvestment;
      default:
        return (config.pricePerShare as number | undefined) ?? property.minInvestment;
    }
  })();

  const descParagraphs = (property.description ?? '').split(/<br\s*\/?>/gi).filter(Boolean);

  return (
    <div className="pb-28 space-y-4">
      {/* ── Header: back, title, location (Figma, Nov 2026) ────────────────── */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => arrivedWithInvest.current ? navigate('/investor/marketplace') : navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 -ml-2 mt-0.5 rounded-full flex items-center justify-center text-foreground hover:bg-foreground/10 shrink-0"
        >
          <RiArrowLeftSLine className="h-6 w-6" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground leading-tight">{property.title}</h1>
          <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{property.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleFavMutation.mutate(
              { propertyId: property.id, isFavorited: isFav },
              { onError: () => toast.error('Failed to update favorites') }
            )}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-foreground/10"
          >
            {isFav
              ? <RiHeartFill className="h-5 w-5 text-accent" />
              : <RiHeartLine className="h-5 w-5 text-foreground/60" />}
          </button>
          <button
            onClick={handleShare}
            aria-label="Share property"
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10"
          >
            <RiShareLine className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* ── Banner card: gallery + about (Figma, Nov 2026) ─────────────────── */}
      <div className="bg-card rounded-3xl p-3 sm:p-4">
        <div className="relative h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden bg-foreground/5">
          {images.length > 0 ? (
            <img
              src={currentImageUrl}
              alt={property.title}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setLightboxOpen(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground/20">
              <RiBuildingLine className="h-12 w-12" />
            </div>
          )}

          {/* Sold Out stamp */}
          {property.inventoryAvailable === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="rotate-[-25deg] border-4 border-red-500 text-red-500 text-3xl font-black tracking-widest px-4 py-1 rounded-md opacity-80 select-none">
                SOLD OUT
              </span>
            </div>
          )}

          {/* Prev / next */}
          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage((i) => (i - 1 + images.length) % images.length)}
                aria-label="Previous image"
                className="absolute left-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white drop-shadow"
              >
                <RiArrowLeftSLine className="h-7 w-7" />
              </button>
              <button
                onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
                aria-label="Next image"
                className="absolute right-1 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white drop-shadow"
              >
                <RiArrowRightSLine className="h-7 w-7" />
              </button>
            </>
          )}

          {/* Bottom: model + return type pills, dots, expand */}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                MODEL_BADGE_COLOR[property.investmentModelType] ?? 'bg-black/60 text-white'
              )}>
                {property.investmentModelTypeLabel}
              </span>
              {property.investmentModelType === 'fractional' && property.returnTypeLabel && (
                <span className="bg-white text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                  {property.returnTypeLabel}
                </span>
              )}
            </div>
            <button
              onClick={() => setLightboxOpen(true)}
              disabled={!images.length}
              className="flex items-center gap-2 bg-black/50 backdrop-blur text-white text-sm font-medium px-3 py-1.5 rounded-lg shrink-0"
            >
              <RiFullscreenLine className="h-4 w-4" />
              <span className="hidden sm:inline">Click to Expand</span>
            </button>
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  aria-label={`Image ${idx + 1}`}
                  className={cn('w-2 h-2 rounded-full', idx === selectedImage ? 'bg-accent' : 'bg-white')}
                />
              ))}
            </div>
          )}
        </div>

        {descParagraphs.length > 0 && (
          <div className="mt-4 px-1">
            <h2 className="text-foreground font-semibold text-sm uppercase">About {property.title}</h2>
            <div className="mt-2 space-y-1">
              {descParagraphs.map((para, i) => (
                <p key={i} className="text-foreground/60 text-sm leading-relaxed">{para}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <div className="space-y-4">

        {/* Two columns on desktop (Figma, Nov 2026): details left; video, milestones and PM right */}
        <div className="grid grid-cols-1 lg:grid-cols-[5fr_4fr] gap-4 items-start">
          {/* ── Left column ── */}
          <div className="space-y-4 min-w-0">
            {/* Property Highlights */}
            {(property.highlights?.length ?? 0) > 0 && (
              <div className={CARD}>
                <h2 className="text-foreground font-semibold text-sm mb-1">Property Highlights</h2>
                <div className="grid grid-cols-2 gap-x-4">
                  {property.highlights!.map((h, i, all) => (
                    <div
                      key={h.label}
                      className={cn(
                        'flex items-center gap-2 py-3 text-sm text-foreground/70 min-w-0',
                        // Divider under every row but the last
                        i < all.length - (all.length % 2 || 2) && 'border-b border-foreground/10',
                      )}
                    >
                      <span className="text-accent shrink-0">
                        {HIGHLIGHT_ICON[h.iconKey] ?? <RiStarLine className="h-4 w-4" />}
                      </span>
                      <span className="truncate">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Model-specific details */}
            {property.investmentModelType === 'land_banking' && (
              <>
                <LandBankingOverview property={property} config={config} />
                <CostBreakdown property={property} priceLabel="Property cost" price={config.pricePerPlot as number} />
              </>
            )}
            {property.investmentModelType === 'save_to_own' && (
              <>
                <SaveToOwnOverview property={property} />
                <CostBreakdown property={property} priceLabel="Price per plot" price={config.propertyPrice as number} />
              </>
            )}
            {property.investmentModelType === 'outright' && (
              <CostBreakdown property={property} priceLabel="Property cost (per unit)" price={property.minInvestment} />
            )}
            {property.investmentModelType === 'co_development' && (
              <>
                <CoDevOverview property={property} config={config} />
                <CostBreakdown
                  property={property}
                  priceLabel="Property cost (per unit)"
                  price={(config.pricePerSlot as number | undefined) ?? property.minInvestment}
                />
              </>
            )}
            {property.investmentModelType === 'fractional' && (
              <>
                <FractionalDetails property={property} config={config} isWindowClosed={isWindowClosed} />
                <CostBreakdown
                  property={property}
                  title={null}
                  priceLabel="Price per slot"
                  price={(config.pricePerShare as number | undefined) ?? property.minInvestment}
                  totalLabel="Total"
                />
              </>
            )}

            {/* Documents + Building Permit */}
            {((property.documents?.length ?? 0) > 0 || property.buildingPermitNumber) && (
              <div className={CARD}>
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h2 className="text-foreground font-semibold text-sm">Property Title Documents</h2>
                  <RiFileTextLine className="h-5 w-5 text-foreground" aria-hidden />
                </div>
                {property.documents?.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.secureUrl ?? doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 py-3 border-b border-foreground/10 last:border-0"
                  >
                    <span className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                      <RiFileTextLine className="h-5 w-5 text-accent" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-foreground text-sm font-semibold truncate">
                        {doc.name ?? doc.fileName ?? doc.originalFilename ?? 'Document'}
                      </span>
                      <span className="block text-foreground/50 text-xs mt-0.5">PDF Document</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-accent text-sm font-semibold shrink-0">
                      View <RiDownload2Line className="h-4 w-4" />
                    </span>
                  </a>
                ))}
                {property.buildingPermitNumber && (
                  <div className="flex items-center gap-3 pt-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground text-sm font-semibold">{property.buildingPermitNumber}</p>
                      <p className="text-foreground/50 text-xs mt-0.5">Building Permit Number</p>
                    </div>
                    <button
                      onClick={() =>
                        navigator.clipboard
                          .writeText(property.buildingPermitNumber!)
                          .then(() => toast.success('Building permit number copied'))
                          .catch(() => toast.error('Could not copy'))
                      }
                      aria-label="Copy building permit number"
                      className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-foreground/60 hover:bg-foreground/10"
                    >
                      <RiFileCopy2Line className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4 min-w-0">
            {property.video && <PropertyVideoCard url={property.video.secureUrl ?? property.video.url} />}

            {property.investmentModelType === 'co_development' && (property.milestones?.length ?? 0) > 0 && (
              <DevelopmentMilestones milestones={property.milestones!} />
            )}

            {property.projectManagerName && (
              <div className="space-y-2">
                <p className="text-foreground font-semibold text-sm">Have questions about this investment?</p>
                <div className={CARD}>
                  <p className="text-foreground/50 text-sm font-medium mb-2">Project Manager</p>
                  <div className="flex items-center gap-3">
                    {property.projectManagerImageUrl ? (
                      <img
                        src={property.projectManagerImageUrl}
                        alt={property.projectManagerName}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold shrink-0">
                        {property.projectManagerName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm truncate capitalize">
                        {property.projectManagerName.toLowerCase()}
                      </p>
                      {property.projectManagerContact && (
                        <p className="text-foreground/50 text-sm mt-0.5">{property.projectManagerContact}</p>
                      )}
                    </div>
                    {property.projectManagerContact && (
                      <div className="flex items-center shrink-0">
                        <a
                          href={whatsappLink(property.projectManagerContact)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="WhatsApp project manager"
                          className="w-10 h-10 flex items-center justify-center hover:opacity-80"
                        >
                          <img src="/resources/whatsapp.png" alt="" className="h-6 w-6" />
                        </a>
                        <span className="w-px h-6 bg-foreground/10" />
                        <a
                          href={`tel:${property.projectManagerContact}`}
                          aria-label="Call project manager"
                          className="w-10 h-10 flex items-center justify-center text-accent hover:opacity-80"
                        >
                          <RiPhoneLine className="h-5 w-5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

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

      {/* ── Sticky CTA bar (Figma, Nov 2026): price left, wide orange button ── */}
      {(property.inventoryAvailable > 0 || property.status === 'sold_out' || property.status === 'closed' || isWindowClosed) && <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-background/95 backdrop-blur-md border-t border-foreground/10 px-4 py-3">
        <div className="max-w-screen-md mx-auto flex items-center gap-6 sm:gap-10">
          <div className="min-w-0 shrink-0">
            <p className="text-foreground/50 text-xs sm:text-sm truncate">{ctaConfig.priceLabel}</p>
            <p className="text-foreground font-bold text-lg leading-tight">{formatCurrency(ctaPrice)}</p>
          </div>
          {!isAvailable ? (
            <Button disabled className="flex-1 h-12 rounded-xl bg-accent text-white border-0 disabled:opacity-50">
              {property.status === 'sold_out' || property.inventoryAvailable === 0 ? 'Sold Out' : ctaConfig.btnText}
            </Button>
          ) : !kycApproved ? (
            <Button
              onClick={() => navigate('/investor/kyc')}
              className="flex-1 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-black"
            >
              Complete KYC
            </Button>
          ) : (
            <Button
              onClick={() => { setAcquireOpen(true); setSearchParams((p) => { p.set('invest', 'true'); return p; }, { replace: true }); }}
              className="flex-1 h-12 rounded-xl bg-accent hover:bg-accent/90 text-white"
            >
              {ctaConfig.btnText}
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

      {/* ── Outright acquire sheet ──────────────────────────────────────────── */}
      {property.investmentModelType === 'outright' && (
        <OutrightAcquireSheet
          open={acquireOpen}
          onOpenChange={(v) => { setAcquireOpen(v); if (!v) setSearchParams((p) => { p.delete('invest'); return p; }, { replace: true }); }}
          property={property}
          onSuccess={(investment) => setSuccessInvestment(investment)}
        />
      )}

      {/* ── Co-development join sheet ───────────────────────────────────────── */}
      {property.investmentModelType === 'co_development' && (
        <CoDevelopmentJoinSheet
          open={acquireOpen}
          onOpenChange={(v) => { setAcquireOpen(v); if (!v) setSearchParams((p) => { p.delete('invest'); return p; }, { replace: true }); }}
          property={property}
          onSuccess={(investment) => setSuccessInvestment(investment)}
        />
      )}

      {/* ── Land banking reserve sheet ──────────────────────────────────────── */}
      {property.investmentModelType === 'land_banking' && (
        <LandBankingReserveSheet
          open={acquireOpen}
          onOpenChange={(v) => { setAcquireOpen(v); if (!v) setSearchParams((p) => { p.delete('invest'); return p; }, { replace: true }); }}
          property={property}
          onSuccess={(investment) => setSuccessInvestment(investment)}
        />
      )}

      {/* ── Save-to-Own sheet ───────────────────────────────────────────────── */}
      {property.investmentModelType === 'save_to_own' && (
        <SaveToOwnSheet
          open={acquireOpen}
          onOpenChange={(v) => { setAcquireOpen(v); if (!v) setSearchParams((p) => { p.delete('invest'); return p; }, { replace: true }); }}
          property={property}
          onSuccess={(investment) => setSuccessInvestment(investment)}
        />
      )}

      {/* ── Fractional invest sheet ─────────────────────────────────────────── */}
      {property.investmentModelType === 'fractional' && (
        <FractionalInvestSheet
          open={acquireOpen}
          onOpenChange={(v) => { setAcquireOpen(v); if (!v) setSearchParams((p) => { p.delete('invest'); return p; }, { replace: true }); }}
          property={property}
          onSuccess={(investment) => setSuccessInvestment(investment)}
        />
      )}

      {/* ── Share modal ─────────────────────────────────────────────────────── */}
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={window.location.href}
        title={property.title}
      />

      {/* ── Investment success modal ────────────────────────────────────────── */}
      {successInvestment && (
        <InvestmentSuccessModal
          open={!!successInvestment}
          onOpenChange={(v) => { if (!v) setSuccessInvestment(null); }}
          investment={successInvestment}
        />
      )}
    </div>
  );
}
