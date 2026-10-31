import { RiBuildingLine, RiMapPinLine } from 'react-icons/ri';
import { cn } from '@/lib/utils';
import { MODEL_BADGE } from '@/components/investment/modelBadge';

/** Property summary used across the exit modals (Figma, Oct 2026): image, title, location, four stats */
export function ExitPropertyCard({
  imageUrl,
  title,
  location,
  stats,
  type,
  typeLabel,
  twoByTwo,
}: {
  imageUrl: string | null | undefined;
  title: string;
  location: string;
  stats: { label: string; value: string }[];
  /** Model badge under the title (save-to-own design) */
  type?: string;
  typeLabel?: string;
  /** Four stats as a 2×2 grid instead of one row */
  twoByTwo?: boolean;
}) {
  return (
    <div className="bg-card border border-foreground/5 rounded-3xl p-3">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-accent/10 flex items-center justify-center">
              <RiBuildingLine className="h-6 w-6 text-accent" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-bold text-lg leading-tight line-clamp-2">{title}</p>
          {typeLabel && (
            <span
              className={cn(
                'inline-block mt-1.5 text-xs font-medium px-3 py-0.5 rounded-full',
                MODEL_BADGE[type ?? ''] ?? 'bg-foreground/10 text-foreground/70',
              )}
            >
              {typeLabel}
            </span>
          )}
          <div className="flex items-center gap-1.5 mt-1.5 text-foreground/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>
      </div>
      <div
        className={cn(
          'grid mt-3 bg-foreground/5 rounded-2xl py-2.5',
          twoByTwo
            ? 'grid-cols-2 gap-y-3 px-3'
            : cn('divide-x divide-foreground/10', stats.length === 4 ? 'grid-cols-4' : 'grid-cols-3'),
        )}
      >
        {stats.map(({ label, value }, i) => (
          <div
            key={label}
            className={cn(
              'min-w-0',
              twoByTwo ? (i % 2 ? 'text-right pl-3 border-l border-foreground/10' : 'pr-3') : 'px-2 first:pl-3',
            )}
          >
            <p className="text-foreground/50 text-xs truncate">{label}</p>
            <p className="text-foreground text-xs sm:text-sm font-bold mt-1 truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
