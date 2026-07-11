import { Link } from 'react-router-dom';
import { RiHeartLine, RiHeartFill, RiMapPinLine, RiArrowRightLine } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/types';

function getPriceLabel(type?: string): string {
  switch (type) {
    case 'fractional': return 'Price per Slot';
    case 'outright':
    case 'co_development': return 'Price per Unit';
    case 'save_to_own': return 'Plot Price';
    case 'land_banking': return 'Price per Plot';
    default: return 'Min. Investment';
  }
}

const MODEL_COLORS: Record<string, string> = {
  fractional: 'bg-violet-500',
  outright: 'bg-amber-500',
  land_banking: 'bg-orange-500',
  save_to_own: 'bg-blue-500',
  co_development: 'bg-emerald-500',
};

function modelBadgeColor(label: string, type?: string): string {
  if (type && MODEL_COLORS[type]) return MODEL_COLORS[type];
  const lower = label?.toLowerCase() ?? '';
  if (lower.includes('fraction')) return MODEL_COLORS.fractional;
  if (lower.includes('outright')) return MODEL_COLORS.outright;
  if (lower.includes('land')) return MODEL_COLORS.land_banking;
  if (lower.includes('save')) return MODEL_COLORS.save_to_own;
  if (lower.includes('co')) return MODEL_COLORS.co_development;
  return 'bg-black/50 backdrop-blur';
}

interface PropertyCardProps {
  property: Property;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function PropertyCard({ property, isFavorited, onToggleFavorite }: PropertyCardProps) {
  const listingStats = property.listingStats ?? [];
  const hasStatBoxes = listingStats.length >= 2;

  return (
    <div className="rounded-2xl bg-foreground/5 border border-foreground/10 overflow-hidden hover:border-foreground/20 transition-all">
      {/* Image */}
      <Link to={`/investor/marketplace/${property.slug}`} className="block relative h-44 bg-foreground/5 overflow-hidden">
        {property.primaryImageUrl ? (
          <img
            src={property.primaryImageUrl}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-4xl">🏠</div>
        )}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className={`${modelBadgeColor(property.investmentModelTypeLabel, property.investmentModelType)} text-white text-[10px] font-semibold px-2 py-1 rounded-xl`}>
            {property.investmentModelTypeLabel === 'Co-development' ? 'Co-Dev' : property.investmentModelTypeLabel}
          </span>
          {property.isNewListing && (
            <span className="bg-white text-accent text-[10px] font-semibold px-2 py-1 rounded-xl">New</span>
          )}
          {property.isHotSelling && (
            <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-1 rounded-xl">🔥 Hot</span>
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/investor/marketplace/${property.slug}`} className="flex-1 min-w-0">
            <h3 className="text-foreground text-sm font-semibold leading-snug line-clamp-2 hover:text-accent transition-colors">
              {property.title}
            </h3>
          </Link>
          <button
            onClick={onToggleFavorite}
            className="shrink-0 w-8 h-8 rounded-full bg-foreground/8 flex items-center justify-center text-foreground/40 hover:text-accent transition-colors"
          >
            {isFavorited ? (
              <RiHeartFill className="h-4 w-4 text-accent" />
            ) : (
              <RiHeartLine className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-1 mt-1.5 text-foreground/50 text-xs">
          <RiMapPinLine className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>

        {/* Stats — rendered generically from whatever the backend computed for this type */}
        {hasStatBoxes && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {listingStats.slice(0, 2).map((stat, i) => (
              <div key={i} className="bg-foreground/5 border border-foreground/10 rounded-lg px-2.5 py-1.5 text-center">
                <p className="text-foreground text-sm font-bold">{stat.value}</p>
                <p className="text-foreground/40 text-[10px] capitalize">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {property.minInvestment != null && (
          <p className={hasStatBoxes ? 'text-foreground/50 text-xs mt-2' : 'text-foreground text-sm font-bold mt-3'}>
            <span className="text-foreground/40 font-normal text-xs">{getPriceLabel(property.investmentModelType)} </span>
            <span className={hasStatBoxes ? 'text-foreground font-semibold' : ''}>
              {formatCurrency(property.minInvestment)}
            </span>
          </p>
        )}

        <Link
          to={`/investor/marketplace/${property.slug}`}
          className="flex items-center justify-end gap-1 text-accent text-xs font-semibold mt-3 hover:underline"
        >
          View Details <RiArrowRightLine className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
