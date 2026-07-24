import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RiHeartLine } from 'react-icons/ri';
import { useFavoritesList, useToggleFavorite } from '@/hooks/useFavorites';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/useToast';
import { PropertyCard } from '@/components/property/PropertyCard';

export default function PartnerFavorites() {
  const [page, setPage] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { favorites, pagination, isLoading } = useFavoritesList(page, 10);
  const toggleFavMutation = useToggleFavorite();

  function handleRemoveConfirm() {
    if (!confirmId) return;
    toggleFavMutation.mutate(
      { propertyId: confirmId, isFavorited: true },
      {
        onSuccess: () => toast.success('Removed from favorites'),
        onError: () => toast.error('Failed to remove favorite'),
        onSettled: () => setConfirmId(null),
      }
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favorites</h1>
        <p className="text-foreground/50 text-sm mt-1">Properties you've saved for later.</p>
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
            <Link to="/partner/properties">
              <Button variant="outline" size="sm">Browse Properties</Button>
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
              onToggleFavorite={() => setConfirmId(property.id)}
              basePath="/partner/properties"
            />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-foreground/60 text-sm">
            {pagination.page} / {pagination.totalPages}
          </span>
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

      <Dialog open={!!confirmId} onOpenChange={(open) => { if (!open) setConfirmId(null); }}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Remove from Favorites?</DialogTitle>
            <DialogDescription>
              This property will be removed from your saved list. You can add it back anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none h-11 rounded-xl"
              onClick={() => setConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 sm:flex-none h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={handleRemoveConfirm}
              disabled={toggleFavMutation.isPending}
            >
              {toggleFavMutation.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
