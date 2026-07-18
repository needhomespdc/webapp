import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiSearchLine,
  RiFilterLine,
  RiSortDesc,
  RiStore2Line,
  RiMapPinLine,
  RiHeartLine,
  RiHeartFill,
  RiShareLine,
} from 'react-icons/ri';
import { usePromotableProperties } from '@/hooks/usePartner';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MarketplaceSortSheet } from '@/components/property/MarketplaceSortSheet';
import {
  MarketplaceFilterSheet,
  EMPTY_FILTERS,
  AMOUNT_RANGES,
  type MarketplaceFilterValues,
} from '@/components/property/MarketplaceFilterSheet';
import { ReferralShareModal } from '@/components/partner/ReferralShareModal';
import { toast } from '@/hooks/useToast';
import { getApiErrorMessage } from '@/lib/fetchClient';
import type { Property } from '@/types';
import type { PropertyFilters } from '@/api/properties.api';

const MODEL_TABS = [
  { value: '', label: 'All' },
  { value: 'fractional', label: 'Fractional' },
  { value: 'co_development', label: 'Co-Dev' },
  { value: 'land_banking', label: 'Land Banking' },
  { value: 'save_to_own', label: 'Save to Own' },
  { value: 'outright', label: 'Outright' },
];

const SORT_LABELS: Record<NonNullable<PropertyFilters['sort']>, string> = {
  popular: 'Popular',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
  name_asc: 'Name: A-Z',
};

const MODEL_COLORS: Record<string, string> = {
  fractional: 'bg-violet-500',
  outright: 'bg-amber-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  co_development: 'bg-emerald-500',
};

// ─── Partner property card ─────────────────────────────────────────────────────

interface PartnerPropertyCardProps {
  property: Property;
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

function PartnerPropertyCard({ property, isFavorited, onToggleFavorite, onShare }: PartnerPropertyCardProps) {
  const badgeColor = MODEL_COLORS[property.investmentModelType] ?? 'bg-black/50 backdrop-blur';
  const listingStats = property.listingStats ?? [];
  const hasStats = listingStats.length >= 2;

  return (
    <div className="rounded-2xl bg-foreground/5 border border-foreground/10 overflow-hidden hover:border-foreground/20 transition-all">
      {/* Image — links to detail page */}
      <Link to={`/partner/properties/${property.slug}`} className="block relative h-44 bg-foreground/5 overflow-hidden">
        {property.primaryImageUrl ? (
          <img
            src={property.primaryImageUrl}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-4xl">🏠</div>
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`${badgeColor} text-white text-[10px] font-semibold px-2 py-1 rounded-xl`}>
            {property.investmentModelTypeLabel === 'Co-development' ? 'Co-Dev' : property.investmentModelTypeLabel}
          </span>
          {property.isNewListing && (
            <span className="bg-white text-accent text-[10px] font-semibold px-2 py-1 rounded-xl">New</span>
          )}
        </div>

        {/* Favorite button */}
        <button
          onClick={(e) => { e.preventDefault(); onToggleFavorite(); }}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center transition-colors hover:bg-black/50"
        >
          {isFavorited ? (
            <RiHeartFill className="h-4 w-4 text-accent" />
          ) : (
            <RiHeartLine className="h-4 w-4 text-white" />
          )}
        </button>
      </Link>

      {/* Content */}
      <div className="p-3.5">
        <Link to={`/partner/properties/${property.slug}`}>
          <h3 className="text-foreground text-sm font-semibold leading-snug line-clamp-1 hover:text-accent transition-colors">
            {property.title}
          </h3>
        </Link>
        <div className="flex items-center gap-1 mt-1 text-foreground/50 text-xs">
          <RiMapPinLine className="h-3 w-3 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>

        {/* Stat boxes */}
        {hasStats && (
          <div className="grid grid-cols-2 gap-2 mt-2.5">
            {listingStats.slice(0, 2).map((stat, i) => (
              <div key={i} className="bg-foreground/5 border border-foreground/10 rounded-lg px-2 py-1.5 text-center">
                <p className="text-foreground text-xs font-bold">{stat.value}</p>
                <p className="text-foreground/40 text-[10px] capitalize">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Commission + share */}
        <div className="flex items-center justify-between mt-2.5">
          <div>
            <p className="text-foreground/40 text-[10px]">Your Commission</p>
            {property.commissionEarning != null ? (
              <p className="text-green-400 text-sm font-bold mt-0.5">{formatCurrency(property.commissionEarning)}</p>
            ) : (
              <p className="text-foreground/30 text-xs mt-0.5">—</p>
            )}
          </div>
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 text-accent text-xs font-semibold hover:opacity-70 transition-opacity"
          >
            <RiShareLine className="h-3.5 w-3.5" />
            Share Link
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PartnerProperties() {
  const [modelType, setModelType] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<NonNullable<PropertyFilters['sort']>>('popular');
  const [filters, setFilters] = useState<MarketplaceFilterValues>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<{ slug: string; title: string } | null>(null);

  const debouncedSearch = useDebouncedValue(searchInput, 250);

  const { properties: allProperties, pagination, isLoading } = usePromotableProperties(page, 9);
  const { favoriteIds } = useFavoriteIds();
  const toggleFavMutation = useToggleFavorite();

  const activeAmountRange = AMOUNT_RANGES.find((r) => r.value === filters.amountRange);
  const activeFilterCount =
    filters.propertyKinds.length + filters.returnTypes.length + (filters.amountRange ? 1 : 0);

  const properties = useMemo(() => {
    let result = allProperties;

    if (modelType) result = result.filter((p) => p.investmentModelType === modelType);

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
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

    result = [...result].sort((a, b) => {
      if (sort === 'price_asc') return a.minInvestment - b.minInvestment;
      if (sort === 'price_desc') return b.minInvestment - a.minInvestment;
      if (sort === 'name_asc') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [allProperties, modelType, debouncedSearch, sort, filters, activeAmountRange]);

  return (
    <div className="space-y-5 w-full min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Properties to Promote</h1>
        <p className="text-foreground/50 text-sm mt-1">Generate referral links and earn commission on conversions.</p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 min-w-0 w-full">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-4 w-4" />
            <Input
              className="pl-9"
              placeholder="Search properties, locations..."
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
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

        {/* Model type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-78 min-[385px]:w-85 min-[420px]:w-93 min-[450px]:w-full">
          {MODEL_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setModelType(t.value); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                modelType === t.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-foreground/5 text-foreground/60 border-foreground/10 hover:text-foreground'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Count + sort */}
        <div className="flex items-center justify-between">
          <span className="text-foreground/50 text-sm">
            {isLoading ? '' : pagination ? `${pagination.total} properties` : `${properties.length} properties`}
          </span>
          <button
            onClick={() => setSortSheetOpen(true)}
            className="flex items-center gap-1.5 text-foreground/70 text-sm hover:text-foreground transition-colors"
          >
            <RiSortDesc className="h-4 w-4" />
            Sort by: <span className="text-foreground font-medium ml-1">{SORT_LABELS[sort]}</span>
          </button>
        </div>
      </div>

      {/* Grid — 2 cols mobile, 3 cols desktop */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
      ) : !properties.length ? (
        <EmptyState
          icon={<RiStore2Line />}
          title="No properties found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {properties.map((property) => (
            <PartnerPropertyCard
              key={property.id}
              property={property}
              isFavorited={favoriteIds.includes(property.id)}
              onToggleFavorite={() =>
                toggleFavMutation.mutate(
                  { propertyId: property.id, isFavorited: favoriteIds.includes(property.id) },
                  { onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update favorites')) }
                )
              }
              onShare={() => setShareTarget({ slug: property.slug, title: property.title })}
            />
          ))}
        </div>
      )}


      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-foreground/60 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MarketplaceSortSheet
        open={sortSheetOpen}
        onOpenChange={setSortSheetOpen}
        value={sort}
        onChange={(v) => setSort(v)}
      />

      <MarketplaceFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        value={filters}
        onApply={(v) => { setFilters(v); setPage(1); }}
      />

      {shareTarget && (
        <ReferralShareModal
          open={!!shareTarget}
          onOpenChange={(v) => { if (!v) setShareTarget(null); }}
          propertySlug={shareTarget.slug}
          propertyTitle={shareTarget.title}
        />
      )}
    </div>
  );
}
