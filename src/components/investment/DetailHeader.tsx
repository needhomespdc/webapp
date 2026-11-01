import { Link } from 'react-router-dom';
import { RiBuildingLine, RiMapPinLine } from 'react-icons/ri';
import { cn } from '@/lib/utils';
import type { Investment } from '@/types';

export interface HeaderStat {
  label: string;
  value: string;
  sub?: string;
  to?: string;
}

/** Main property image: the API's propertyImageUrl, else the first image on the frozen snapshot */
export function investmentImage(inv: Investment): string | undefined {
  if (inv.propertyImageUrl) return inv.propertyImageUrl;
  const images = ((inv.snapshot ?? {}) as { images?: unknown }).images;
  const first = Array.isArray(images) ? images[0] : undefined;
  if (typeof first === 'string' && first) return first;
  const url = (first as { url?: unknown; secureUrl?: unknown } | undefined)?.url ?? (first as { secureUrl?: unknown } | undefined)?.secureUrl;
  return typeof url === 'string' && url ? url : undefined;
}

/** Coloured investment header (Figma, Oct 2026): image, title, chips, location, four stats, property link */
export function DetailHeader({
  inv,
  statusChip,
  propertyType,
  slug,
  stats,
  bgClass,
  linkClass,
  statsGridClass = 'grid-cols-2 sm:grid-cols-4',
}: {
  inv: Investment;
  statusChip: React.ReactNode;
  propertyType?: string;
  slug?: string;
  stats: HeaderStat[];
  bgClass: string;
  linkClass: string;
  statsGridClass?: string;
}) {
  const image = investmentImage(inv);
  return (
    <div className={cn('rounded-3xl p-4 sm:p-5', bgClass)}>
      <div className="flex gap-4">
        {image ? (
          <img src={image} alt={inv.title} className="w-20 h-20 rounded-2xl object-cover shrink-0" />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-white/10 shrink-0 flex items-center justify-center">
            <RiBuildingLine className="h-8 w-8 text-white/40" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-xl leading-tight">{inv.title}</p>
          <div className="flex items-center gap-1.5 flex-wrap mt-2">
            <span className="bg-black/25 text-white text-xs px-3 py-1 rounded-full">{inv.typeLabel}</span>
            {propertyType && <span className="bg-black/25 text-white text-xs px-3 py-1 rounded-full">{propertyType}</span>}
            {statusChip}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-white/70 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span className="truncate">{inv.location}</span>
          </div>
        </div>
      </div>

      <div className={cn('grid gap-4 mt-4 pt-4 border-t border-white/15', statsGridClass)}>
        {stats.map((s) => {
          const inner = (
            <>
              <p className="text-white/60 text-xs">{s.label}</p>
              <p className="text-white font-bold text-sm mt-1">{s.value}</p>
              {s.sub && <p className="text-white/60 text-xs mt-1">{s.sub}</p>}
            </>
          );
          return s.to ? (
            <Link key={s.label} to={s.to} className="min-w-0 hover:opacity-80">
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="min-w-0">
              {inner}
            </div>
          );
        })}
      </div>

      {slug && (
        <Link
          to={`/investor/marketplace/${slug}`}
          className={cn('inline-block mt-4 bg-white font-semibold text-sm px-5 py-2.5 rounded-full hover:bg-white/90 transition-colors', linkClass)}
        >
          View Property details
        </Link>
      )}
    </div>
  );
}

