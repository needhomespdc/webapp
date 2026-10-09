// Filter options/defaults shared by the marketplace filter sheet and the pages that use it.
// Kept out of MarketplaceFilterSheet.tsx so that file only exports components (Fast Refresh).

export const AMOUNT_RANGES: { value: string; label: string; min?: number; max?: number }[] = [
  { value: 'under_100k', label: 'Under ₦100k', max: 100_000 },
  { value: '100k_500k', label: '₦100k - ₦500k', min: 100_000, max: 500_000 },
  { value: '500k_1m', label: '₦500k - ₦1M', min: 500_000, max: 1_000_000 },
  { value: 'over_1m', label: '₦1M+', min: 1_000_000 },
];

export interface MarketplaceFilterValues {
  propertyKinds: string[];
  returnTypes: string[];
  amountRange: string | null;
}

export const EMPTY_FILTERS: MarketplaceFilterValues = {
  propertyKinds: [],
  returnTypes: [],
  amountRange: null,
};
