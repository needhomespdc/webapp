import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RiSearchLine, RiFilterLine, RiSortDesc } from 'react-icons/ri';
import { usePropertyList } from '@/hooks/useProperty';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/useToast';
import { PropertyCard } from '@/components/property/PropertyCard';
import {
  MarketplaceFilterSheet,
  EMPTY_FILTERS,
  AMOUNT_RANGES,
  type MarketplaceFilterValues,
} from '@/components/property/MarketplaceFilterSheet';
import { MarketplaceSortSheet } from '@/components/property/MarketplaceSortSheet';
import type { PropertyFilters } from '@/api/properties.api';

const SEARCH_DEBOUNCE_MS = 3000;
const DEFAULT_SORT: NonNullable<PropertyFilters['sort']> = 'popular';
const VALID_SORTS = new Set<PropertyFilters['sort']>(['popular', 'price_asc', 'price_desc', 'name_asc']);

const MODEL_TABS: { value: string; label: string }[] = [
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

function parseCsv(value: string | null): string[] {
  return value ? value.split(',').filter(Boolean) : [];
}

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Seed every piece of state from the URL once, so a shared link reproduces
  // exactly this view (search, model tab, sort, filters, page).
  const [modelType, setModelType] = useState(() => searchParams.get('type') ?? '');
  const [searchInput, setSearchInput] = useState(() => searchParams.get('q') ?? '');
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 1);
  const [sort, setSort] = useState<NonNullable<PropertyFilters['sort']>>(() => {
    const fromUrl = searchParams.get('sort') as PropertyFilters['sort'];
    return fromUrl && VALID_SORTS.has(fromUrl) ? fromUrl : DEFAULT_SORT;
  });
  const [filters, setFilters] = useState<MarketplaceFilterValues>(() => ({
    propertyKinds: parseCsv(searchParams.get('propertyKind')),
    returnTypes: parseCsv(searchParams.get('returnType')),
    amountRange: searchParams.get('amount'),
  }));
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  // 3 seconds after the user stops typing, fire the search request.
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  // Keep the URL in sync with the active view (replace, not push, so paging
  // through results doesn't spam browser history).
  useEffect(() => {
    const params = new URLSearchParams();
    if (modelType) params.set('type', modelType);
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (sort !== DEFAULT_SORT) params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    if (filters.propertyKinds.length) params.set('propertyKind', filters.propertyKinds.join(','));
    if (filters.returnTypes.length) params.set('returnType', filters.returnTypes.join(','));
    if (filters.amountRange) params.set('amount', filters.amountRange);
    setSearchParams(params, { replace: true });
  }, [modelType, debouncedSearch, sort, page, filters, setSearchParams]);

  const apiFilters: PropertyFilters = useMemo(
    () => ({
      page,
      limit: 12,
      type: modelType || undefined,
      search: debouncedSearch || undefined,
      sort,
      propertyKind: filters.propertyKinds[0],
      returnType: filters.returnTypes[0],
    }),
    [page, modelType, debouncedSearch, sort, filters]
  );

  const { properties: fetchedProperties, pagination, isLoading } = usePropertyList(apiFilters);
  const { favoriteIds } = useFavoriteIds();
  const toggleFavMutation = useToggleFavorite();

  const favSet = new Set(favoriteIds);
  const activeAmountRange = AMOUNT_RANGES.find((r) => r.value === filters.amountRange);

  // Client-side safety net: re-applies propertyKind/returnType/amount in case the
  // backend doesn't filter on those query params yet (see properties.api.ts).
  const properties = fetchedProperties.filter((p) => {
    if (filters.propertyKinds.length && !filters.propertyKinds.includes(p.propertyKind)) return false;
    if (filters.returnTypes.length && !filters.returnTypes.includes(p.returnType)) return false;
    if (activeAmountRange) {
      if (activeAmountRange.min != null && p.minInvestment < activeAmountRange.min) return false;
      if (activeAmountRange.max != null && p.minInvestment > activeAmountRange.max) return false;
    }
    return true;
  });

  const activeFilterCount =
    filters.propertyKinds.length + filters.returnTypes.length + (filters.amountRange ? 1 : 0);

  const hasPrevPage = page > 1;
  const hasNextPage = pagination ? page < pagination.totalPages : false;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-foreground/50 text-sm mt-1">Discover premium properties and opportunities.</p>
        <p className="text-foreground/50 text-sm mt-1">Invest with as little as <span className='text-accent'>₦50,000</span>.</p>
      </div>

      {/* Search + filter trigger */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 h-4 w-4" />
            <Input
              className="pl-9"
              placeholder="Search properties, locations..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
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

        {/* Investment model tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {MODEL_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setModelType(t.value);
                setPage(1);
              }}
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

        {/* Sort trigger */}
        <div className="flex items-center justify-between">
          <span className="text-foreground/50 text-sm">{pagination ? `${pagination.total} properties` : ''}</span>
          <button
            onClick={() => setSortSheetOpen(true)}
            className="flex items-center gap-1.5 text-foreground/70 text-sm hover:text-foreground transition-colors"
          >
            <RiSortDesc className="h-4 w-4" />
            Sort by: <span className="text-foreground font-medium">{SORT_LABELS[sort]}</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-64 w-full rounded-2xl" />)}
        </div>
      ) : !properties.length ? (
        <EmptyState
          icon={<RiFilterLine />}
          title="No properties found"
          description="Try adjusting your filters or search query."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setModelType('');
                setSearchInput('');
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited={favSet.has(property.id)}
              onToggleFavorite={() =>
                toggleFavMutation.mutate(
                  { propertyId: property.id, isFavorited: favSet.has(property.id) },
                  { onError: () => toast.error('Failed to update favorites') }
                )
              }
            />
          ))}
        </div>
      )}

      {/* Pagination — always visible once we have results, buttons disable at the edges */}
      {pagination && properties.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="outline" size="sm" disabled={!hasPrevPage} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-foreground/60 text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={!hasNextPage} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <MarketplaceFilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        value={filters}
        onApply={(v) => {
          setFilters(v);
          setPage(1);
        }}
      />
      <MarketplaceSortSheet
        open={sortSheetOpen}
        onOpenChange={setSortSheetOpen}
        value={sort}
        onChange={(v) => {
          setSort(v);
          setPage(1);
        }}
      />
    </div>
  );
}
