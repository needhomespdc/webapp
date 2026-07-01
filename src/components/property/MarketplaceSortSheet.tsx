import { RiCheckLine } from 'react-icons/ri';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import type { PropertyFilters } from '@/api/properties.api';

const SORT_OPTIONS: { value: NonNullable<PropertyFilters['sort']>; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A-Z' },
];

interface MarketplaceSortSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: NonNullable<PropertyFilters['sort']>;
  onChange: (value: NonNullable<PropertyFilters['sort']>) => void;
}

export function MarketplaceSortSheet({ open, onOpenChange, value, onChange }: MarketplaceSortSheetProps) {
  const isDesktop = useIsDesktop();
  const side = isDesktop ? 'right' : 'bottom';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side} className={cn(side === 'bottom' ? 'rounded-t-3xl' : 'sm:max-w-md')}>
        <SheetHeader>
          <SheetTitle>Sort by</SheetTitle>
        </SheetHeader>
        <div className="space-y-2 mt-2 pb-2">
          {SORT_OPTIONS.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  onOpenChange(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-medium transition-all',
                  selected ? 'bg-accent/15 text-accent' : 'bg-foreground/5 text-foreground/80 hover:bg-foreground/10'
                )}
              >
                {opt.label}
                {selected && <RiCheckLine className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
