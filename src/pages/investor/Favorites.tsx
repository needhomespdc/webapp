import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiHeartLine } from 'react-icons/ri';
import { useFavoritesList, useToggleFavorite } from '@/hooks/useFavorites';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';
import { PropertyCard } from '@/components/property/PropertyCard';

export default function Favorites() {
  const [page, setPage] = useState(1);
  const { favorites, pagination, isLoading } = useFavoritesList(page, 10);
  const toggleFavMutation = useToggleFavorite();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Favorites</h1>
        <p className="text-white/50 text-sm mt-1">Properties you've saved for later.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-56 w-full rounded-2xl" />)}
        </div>
      ) : !favorites.length ? (
        <EmptyState
          icon={<RiHeartLine />}
          title="No favorites yet"
          description="Save properties you're interested in to find them here later."
          action={
            <Link to="/investor/marketplace">
              <Button variant="outline" size="sm">Browse Marketplace</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              isFavorited
              onToggleFavorite={() =>
                toggleFavMutation.mutate(
                  { propertyId: property.id, isFavorited: true },
                  { onError: () => toast.error('Failed to remove favorite') }
                )
              }
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-white/60 text-sm">{pagination.page} / {pagination.totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
