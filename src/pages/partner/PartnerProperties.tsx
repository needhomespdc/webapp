import { useState } from 'react';
import { RiStore2Line, RiMapPinLine, RiLinkM, RiShareLine } from 'react-icons/ri';
import { usePromotableProperties } from '@/hooks/usePartner';
import { useReferralLink } from '@/hooks/useReferralLink';
import { formatCurrency } from '@/lib/utils';
import { EmptyState } from '@/components/shared/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import type { Property } from '@/types';

export default function PartnerProperties() {
  const [page, setPage] = useState(1);
  const { properties, pagination, isLoading } = usePromotableProperties(page, 10);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Promotable Properties</h1>
        <p className="text-foreground/50 text-sm mt-1">Generate referral links and earn commission on conversions.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      ) : !properties.length ? (
        <EmptyState icon={<RiStore2Line />} title="No promotable properties" description="Check back later for new listings to promote." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {properties.map((property) => (
            <PropertyPromoCard key={property.id} property={property} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-foreground/60 text-sm">{pagination.page} / {pagination.totalPages}</span>
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

function PropertyPromoCard({ property }: { property: Property }) {
  const { link, copy } = useReferralLink(property.slug);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: property.title, url: link }).catch(() => null);
    } else {
      copy();
    }
  };

  return (
    <div className="rounded-2xl bg-foreground/5 border border-foreground/10 overflow-hidden">
      <div className="h-36 bg-foreground/5 overflow-hidden">
        {property.primaryImageUrl ? (
          <img src={property.primaryImageUrl} alt={property.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20 text-3xl">🏠</div>
        )}
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-foreground text-sm font-semibold line-clamp-1">{property.title}</h3>
        <div className="flex items-center gap-1 text-foreground/50 text-xs">
          <RiMapPinLine className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{property.location}</span>
        </div>
        <p className="text-foreground text-sm font-bold">
          {formatCurrency(property.totalPrice ?? property.minInvestment)}
          {property.totalPrice == null ? ' min.' : ''}
        </p>
        <div className="flex gap-2 pt-1">
          <Button variant="outline" size="sm" className="flex-1" onClick={copy}>
            <RiLinkM className="h-4 w-4" />
            Copy Link
          </Button>
          <Button size="sm" className="flex-1" onClick={handleShare}>
            <RiShareLine className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
}
