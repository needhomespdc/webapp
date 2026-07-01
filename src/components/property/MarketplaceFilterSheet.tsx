import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

const PROPERTY_KINDS: { value: string; label: string }[] = [
  { value: 'duplex', label: 'Duplex' },
  { value: 'bungalow', label: 'Bungalow' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'terrace', label: 'Terrace' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'land', label: 'Land' },
  { value: 'villa', label: 'Villa' },
  { value: 'house', label: 'House' },
  { value: 'mixed_use', label: 'Mixed Use' },
];

const RETURN_TYPES: { value: string; label: string }[] = [
  { value: 'income_generating', label: 'Income generating' },
  { value: 'capital_appreciation', label: 'Capital acquisition' },
  { value: 'rental_yield', label: 'Rental yield' },
];

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

interface MarketplaceFilterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: MarketplaceFilterValues;
  onApply: (value: MarketplaceFilterValues) => void;
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-full text-sm font-medium border transition-all',
        selected
          ? 'bg-accent text-white border-accent'
          : 'bg-foreground/5 text-foreground/70 border-foreground/10 hover:border-foreground/20'
      )}
    >
      {children}
    </button>
  );
}

export function MarketplaceFilterSheet({ open, onOpenChange, value, onApply }: MarketplaceFilterSheetProps) {
  const [draft, setDraft] = useState<MarketplaceFilterValues>(value);
  const isDesktop = useIsDesktop();
  const side = isDesktop ? 'right' : 'bottom';

  // Reset the draft to the active filters whenever the sheet is (re)opened.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const toggle = (list: string[], item: string) =>
    list.includes(item) ? list.filter((i) => i !== item) : [...list, item];

  const handleClearAll = () => setDraft(EMPTY_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          'flex flex-col',
          side === 'bottom' ? 'max-h-[85vh] rounded-t-3xl' : 'sm:max-w-md'
        )}
      >
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <button onClick={handleClearAll} className="text-accent text-sm font-medium hover:underline">
              Clear all
            </button>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-6 mt-2 pb-4">
          <div>
            <h3 className="text-foreground font-semibold text-sm mb-3">Property type</h3>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_KINDS.map((k) => (
                <Chip
                  key={k.value}
                  selected={draft.propertyKinds.includes(k.value)}
                  onClick={() => setDraft((d) => ({ ...d, propertyKinds: toggle(d.propertyKinds, k.value) }))}
                >
                  {k.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-semibold text-sm mb-3">Return type</h3>
            <div className="flex flex-wrap gap-2">
              {RETURN_TYPES.map((r) => (
                <Chip
                  key={r.value}
                  selected={draft.returnTypes.includes(r.value)}
                  onClick={() => setDraft((d) => ({ ...d, returnTypes: toggle(d.returnTypes, r.value) }))}
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-foreground font-semibold text-sm mb-3">Investment amount</h3>
            <div className="flex flex-wrap gap-2">
              {AMOUNT_RANGES.map((a) => (
                <Chip
                  key={a.value}
                  selected={draft.amountRange === a.value}
                  onClick={() =>
                    setDraft((d) => ({ ...d, amountRange: d.amountRange === a.value ? null : a.value }))
                  }
                >
                  {a.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <Button className="w-full shrink-0" size="lg" onClick={handleApply}>
          Apply filters
        </Button>
      </SheetContent>
    </Sheet>
  );
}
