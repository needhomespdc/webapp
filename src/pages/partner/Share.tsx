import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiSearchLine,
  RiFilterLine,
  RiShareLine,
  RiFileCopy2Line,
  RiCheckLine,
  RiMapPinLine,
  // RiLinksLine,
  // RiInformationLine,
  RiEyeLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiWhatsappFill,
  RiFacebookFill,
  RiLinkedinFill,
  RiTwitterXFill,
  RiMailFill,
} from 'react-icons/ri';
import { HiOutlineUsers, HiOutlineWallet } from 'react-icons/hi2';
import { useAuth } from '@/hooks/useAuth';
import { useReferralAnalytics, usePromotableProperties, useCommissionEntries } from '@/hooks/usePartner';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ReferralShareModal } from '@/components/partner/ReferralShareModal';
import {
  MarketplaceFilterSheet,
  EMPTY_FILTERS,
  AMOUNT_RANGES,
  type MarketplaceFilterValues,
} from '@/components/property/MarketplaceFilterSheet';
import type { Property } from '@/types';

const PERIOD_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'All Time', value: 'all_time' },
];

const MODEL_COLORS: Record<string, string> = {
  fractional: 'bg-violet-500',
  outright: 'bg-amber-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  co_development: 'bg-emerald-500',
};

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
    href: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: 'LinkedIn',
    icon: RiLinkedinFill,
    bg: 'bg-[#0A66C2]',
    href: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: 'Email',
    icon: RiMailFill,
    bg: 'bg-[#EA4335]',
    href: (url: string, title: string) =>
      `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
] as const;

// ─── General share modal ─────────────────────────────────────────────────────

function GeneralShareModal({
  open,
  onOpenChange,
  link,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  link: string;
}) {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [copied, setCopied] = useState(false);
  const title = 'Invest in premium Nigerian real estate on NeedHomes';

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const body = (
    <div className="px-5 py-5 space-y-5">
      <div className="flex items-center justify-center gap-4 flex-wrap">
        {SOCIALS.map(({ label, icon: Icon, bg, href }) => (
          <a
            key={label}
            href={href(link, title)}
            target="_blank"
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
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 mx-auto text-accent font-semibold text-sm"
      >
        {copied ? <RiCheckLine className="h-4 w-4" /> : <RiFileCopy2Line className="h-4 w-4" />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader><SheetTitle>Share Your Referral Link</SheetTitle></SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-foreground/10">
          <DialogTitle className="text-base font-semibold">Share Your Referral Link</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

// ─── Quick Share property card ────────────────────────────────────────────────

function QuickShareCard({ property, onShare }: { property: Property; onShare: () => void }) {
  const badgeColor = MODEL_COLORS[property.investmentModelType] ?? 'bg-black/50';

  return (
    <div className="rounded-2xl bg-foreground/5 border border-foreground/10 overflow-hidden">
      <Link to={`/partner/properties/${property.slug}`} className="block relative h-40 overflow-hidden bg-foreground/5">
        {property.primaryImageUrl ? (
          <img
            src={property.primaryImageUrl}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-4xl">🏠</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        <span className={`absolute top-2 left-2 ${badgeColor} text-white text-[10px] font-semibold px-2 py-0.5 rounded-xl`}>
          {property.investmentModelTypeLabel === 'Co-development' ? 'Co-Dev' : property.investmentModelTypeLabel}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); onShare(); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
        >
          <RiShareLine className="h-4 w-4" />
        </button>
      </Link>

      <div className="p-3">
        <Link to={`/partner/properties/${property.slug}`}>
          <h3 className="text-foreground text-sm font-bold uppercase tracking-tight line-clamp-1 hover:text-accent transition-colors">
            {property.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-0.5 text-foreground/50 text-xs">
          <RiMapPinLine className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-accent text-sm font-semibold">From {formatCurrency(property.minInvestment)}</p>
          {property.commissionRate != null && (
            <span className="bg-green-500/15 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full">
              {property.commissionRate.toFixed(1)}% Comm.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Share() {
  const { user } = useAuth();
  const [period, setPeriod] = useState('this_month');
  const [periodOpen, setPeriodOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<MarketplaceFilterValues>(EMPTY_FILTERS);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ slug: string; title: string } | null>(null);
  const [generalShareOpen, setGeneralShareOpen] = useState(false);

  const { analytics, isLoading: analyticsLoading } = useReferralAnalytics(period);
  const { properties, isLoading: propertiesLoading } = usePromotableProperties(1, 8);
  const { entries: commissionEntries, isLoading: entriesLoading } = useCommissionEntries(1, 3);

  const referralCode = (user?.referralCode ?? '').toLowerCase();
  const shareLink = `https://needhomes.ng/r/${referralCode}`;

  const currentPeriodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label ?? 'This Month';

  const activeAmountRange = AMOUNT_RANGES.find((r) => r.value === filters.amountRange);
  const activeFilterCount =
    filters.propertyKinds.length + filters.returnTypes.length + (filters.amountRange ? 1 : 0);

  const filteredProperties = useMemo(() => {
    let result = properties;
    if (searchInput) {
      const q = searchInput.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q)
      );
    }
    if (filters.propertyKinds.length)
      result = result.filter((p) => filters.propertyKinds.includes(p.propertyKind));
    if (filters.returnTypes.length)
      result = result.filter((p) => filters.returnTypes.includes(p.returnType));
    if (activeAmountRange) {
      if (activeAmountRange.min != null) result = result.filter((p) => p.minInvestment >= activeAmountRange.min!);
      if (activeAmountRange.max != null) result = result.filter((p) => p.minInvestment <= activeAmountRange.max!);
    }
    return result;
  }, [properties, searchInput, filters, activeAmountRange]);

  const stats = [
    {
      icon: RiEyeLine,
      label: 'Views',
      value: analyticsLoading ? '—' : String(analytics?.totalClicks ?? 0),
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400',
    },
    {
      icon: RiShareLine,
      label: 'Shares',
      value: analyticsLoading ? '—' : String(analytics?.totalShares ?? 0),
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      icon: HiOutlineUsers,
      label: 'Leads',
      value: analyticsLoading ? '—' : String(analytics?.totalConversions ?? 0),
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      icon: HiOutlineWallet,
      label: 'Est. Earnings',
      value: analyticsLoading
        ? '—'
        : analytics?.totalLifetimeEarnings
          ? formatCurrency(analytics.totalLifetimeEarnings)
          : '₦0',
      iconBg: 'bg-accent/20',
      iconColor: 'text-accent',
    },
  ];

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Share & Promote</h1>
        <p className="text-foreground/50 text-sm mt-1">Share properties and earn more commission</p>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search properties to share..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="default"
          size="md"
          className="relative shrink-0"
          onClick={() => setFilterSheetOpen(true)}
        >
          <RiFilterLine className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Your Performance ────────────────────────────────────────────── */}
      <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-foreground font-semibold text-base">Your Performance</h2>
          <div className="relative">
            <button
              onClick={() => setPeriodOpen((v) => !v)}
              className="flex items-center gap-1.5 bg-foreground/5 border border-foreground/10 rounded-xl px-3 py-1.5 text-sm text-foreground font-medium"
            >
              {currentPeriodLabel}
              <RiArrowDownSLine className={cn('h-4 w-4 text-foreground/50 transition-transform', periodOpen && 'rotate-180')} />
            </button>
            {periodOpen && (
              <div className="absolute right-0 top-full mt-1 bg-card border border-foreground/10 rounded-xl shadow-xl z-20 min-w-36 overflow-hidden">
                {PERIOD_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setPeriod(opt.value); setPeriodOpen(false); }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-foreground/5',
                      period === opt.value ? 'text-accent font-semibold' : 'text-foreground/70'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <div className={cn('w-11 h-11 rounded-full flex items-center justify-center shrink-0', stat.iconBg)}>
                <stat.icon className={cn('h-5 w-5', stat.iconColor)} />
              </div>
              <div className="text-center">
                <p className="text-foreground font-bold text-sm leading-tight">{stat.value}</p>
                <p className="text-foreground/40 text-[10px] mt-0.5 leading-tight">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Share Popular Properties ───────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-base">Quick Share Popular Properties</h2>
          <Link to="/partner/properties" className="text-accent text-sm font-medium">View All</Link>
        </div>

        {propertiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
          </div>
        ) : filteredProperties.length === 0 ? (
          <p className="text-foreground/40 text-sm py-4 text-center">No properties match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredProperties.slice(0, 4).map((property) => (
              <QuickShareCard
                key={property.id}
                property={property}
                onShare={() => setShareTarget({ slug: property.slug, title: property.title })}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Share Activity ────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground font-semibold text-base">Recent Share Activity</h2>
          <Link to="/partner/commissions" className="text-accent text-sm font-medium">View All</Link>
        </div>

        {entriesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}
          </div>
        ) : commissionEntries.length === 0 ? (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl p-6 text-center">
            <p className="text-foreground/40 text-sm">No recent activity yet.</p>
            <p className="text-foreground/30 text-xs mt-1">Share properties to start earning commission.</p>
          </div>
        ) : (
          <div className="bg-foreground/5 border border-foreground/10 rounded-2xl overflow-hidden">
            {commissionEntries.map((entry, i) => (
              <div
                key={entry.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i < commissionEntries.length - 1 && 'border-b border-foreground/10'
                )}
              >
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                  <RiShareLine className="h-4 w-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-medium truncate">{entry.propertyTitle}</p>
                  <p className="text-foreground/40 text-xs mt-0.5">
                    {/* {formatCurrency(entry.commissionAmount)} commission */}
                    0 commission
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                      entry.status === 'paid'
                        ? 'bg-green-500/15 text-green-400'
                        : entry.status === 'approved'
                          ? 'bg-blue-500/15 text-blue-400'
                          : 'bg-foreground/10 text-foreground/40'
                    )}
                  >
                    {entry.status === 'paid'
                      ? 'Paid'
                      : entry.status === 'approved'
                        ? 'Lead Generated'
                        : 'Pending'}
                  </span>
                  {/* <p className="text-foreground/30 text-[10px]">{formatDate(entry.createdAt)}</p> */}
                </div>
                <RiArrowRightSLine className="h-4 w-4 text-foreground/30 shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      {shareTarget && (
        <ReferralShareModal
          open={!!shareTarget}
          onOpenChange={(v) => { if (!v) setShareTarget(null); }}
          propertySlug={shareTarget.slug}
          propertyTitle={shareTarget.title}
        />
      )}

      <GeneralShareModal
        open={generalShareOpen}
        onOpenChange={setGeneralShareOpen}
        link={shareLink}
      />

      <MarketplaceFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        value={filters}
        onApply={(v) => setFilters(v)}
      />
    </div>
  );
}
