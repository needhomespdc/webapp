import { Link } from 'react-router-dom';
import { RiHeartLine, RiHeartFill, RiMapPinLine, RiArrowRightLine } from 'react-icons/ri';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/types';

interface PropertyCardProps {
  property: Property;
  isFavorited: boolean;
  onToggleFavorite: () => void;
}

export function PropertyCard({ property, isFavorited, onToggleFavorite }: PropertyCardProps) {
  const listingStats = property.listingStats ?? [];
  const hasStatBoxes = listingStats.length >= 2;
  const progress =
    property.progressPercent ??
    (property.inventoryTotal > 0
      ? Math.round(((property.inventoryTotal - property.inventoryAvailable) / property.inventoryTotal) * 100)
      : null);

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
          <span className="bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
            {property.investmentModelTypeLabel}
          </span>
          {property.isNewListing && (
            <span className="bg-accent text-white text-[10px] font-semibold px-2 py-1 rounded-lg">New</span>
          )}
          {property.isHotSelling && (
            <span className="bg-red-500 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">Hot</span>
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
            className="shrink-0 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-foreground/70 hover:text-red-400 transition-colors"
          >
            {isFavorited ? (
              <RiHeartFill className="h-4 w-4 text-red-400" />
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
        {hasStatBoxes ? (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {listingStats.slice(0, 2).map((stat, i) => (
              <div key={i} className="bg-foreground/5 border border-foreground/10 rounded-lg px-2.5 py-1.5 text-center">
                <p className="text-foreground text-sm font-bold">{stat.value}</p>
                <p className="text-foreground/40 text-[10px] capitalize">{stat.label}</p>
              </div>
            ))}
          </div>
        ) : property.totalPrice != null ? (
          <p className="text-foreground text-sm font-bold mt-3">
            <span className="text-foreground/40 font-normal text-xs">Price </span>
            {formatCurrency(property.totalPrice)}
          </p>
        ) : listingStats[0] ? (
          <p className="text-foreground text-sm font-bold mt-3">
            <span className="text-foreground/40 font-normal text-xs capitalize">{listingStats[0].label} </span>
            {listingStats[0].value}
          </p>
        ) : null}

        {hasStatBoxes && property.totalPrice == null && (
          <p className="text-foreground/50 text-xs mt-2">
            Min. Investment <span className="text-foreground font-semibold">{formatCurrency(property.minInvestment)}</span>
          </p>
        )}

        {hasStatBoxes && progress != null && (
          <div className="h-1.5 bg-foreground/10 rounded-full overflow-hidden mt-2">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress}%` }} />
          </div>
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
