import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  RiArrowLeftLine,
  RiMapPinLine,
  RiHeartLine,
  RiHeartFill,
  RiCheckLine,
  RiFileTextLine,
  RiAlertLine,
} from 'react-icons/ri';
import { partnersApi } from '@/api/partners.api';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { usePropertyBySlug } from '@/hooks/useProperty';
import { useFavoriteIds, useToggleFavorite } from '@/hooks/useFavorites';
import { useCheckoutInvestment } from '@/hooks/useInvestment';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Loader } from '@/components/shared/Loader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/useToast';
import { ApiError } from '@/lib/fetchClient';

export default function PropertyDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedImage, setSelectedImage] = useState(0);
  const [investOpen, setInvestOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [pin, setPin] = useState('');

  const { property, isLoading } = usePropertyBySlug(slug);
  const { favoriteIds } = useFavoriteIds();
  const isFav = favoriteIds.includes(property?.id ?? '');

  // Track referral click on mount
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && property) {
      partnersApi.trackReferralEvent({
        referralCode: ref,
        eventType: 'click',
        propertySlug: property.slug,
        propertyTitle: property.title,
        channel: 'direct',
      }).catch(() => null);
    }
  }, [searchParams, property]);

  const toggleFavMutation = useToggleFavorite();
  const investMutation = useCheckoutInvestment();

  const handleInvest = () => {
    investMutation.mutate(
      { propertyId: property!.id, quantity, transactionPin: pin },
      {
        onSuccess: () => {
          toast.success('Investment successful!');
          setInvestOpen(false);
          navigate('/investor/portfolio');
        },
        onError: (err: unknown) => {
          const msg = err instanceof ApiError ? err.message : 'Investment failed. Please try again.';
          toast.error(msg);
        },
      }
    );
  };

  if (isLoading) return <Loader fullPage />;
  if (!property) return null;

  const kycApproved = user?.kycStatus === 'approved';
  // Per-unit price isn't a confirmed field on the detail response yet (the
  // per-type `config` object's exact detail-view shape is unverified) — using
  // minInvestment as a placeholder estimate. Outright pricing comes from
  // outrightCheckoutPreview separately and isn't affected by this.
  const pricePerUnit = property.totalPrice ?? property.minInvestment;
  const total = pricePerUnit * quantity;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors"
      >
        <RiArrowLeftLine className="h-4 w-4" />
        Back to Marketplace
      </button>

      {/* Images — falls back to the single primaryImageUrl when the richer
          images[] array isn't present on the detail response */}
      {(property.images?.length ?? 0) > 0 || property.primaryImageUrl ? (
        <div className="space-y-2">
          <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden bg-white/5">
            <img
              src={property.images?.[selectedImage]?.url ?? property.primaryImageUrl ?? ''}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <StatusBadge status={property.status} />
              <button
                onClick={() =>
                  toggleFavMutation.mutate(
                    { propertyId: property.id, isFavorited: isFav },
                    { onError: () => toast.error('Failed to update favorites') }
                  )
                }
                className="p-2 bg-black/50 rounded-xl text-white/60 hover:text-red-400 transition-colors"
              >
                {isFav ? <RiHeartFill className="h-5 w-5 text-red-400" /> : <RiHeartLine className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {property.images && property.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {property.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(idx)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === selectedImage ? 'border-accent' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-xs text-accent font-semibold uppercase tracking-wider">
            {property.investmentModelTypeLabel}
          </span>
          <h1 className="text-xl font-bold text-white mt-0.5">{property.title}</h1>
          <div className="flex items-center gap-1 mt-1 text-white/50 text-sm">
            <RiMapPinLine className="h-4 w-4 shrink-0" />
            <span>{property.location}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-white">
            {formatCurrency(property.totalPrice ?? property.minInvestment)}
          </p>
          <p className="text-white/50 text-xs">{property.totalPrice != null ? 'price' : 'min. investment'}</p>
        </div>
      </div>

      {/* Stats — generic listingStats from the backend plus inventory */}
      <div className="grid grid-cols-3 gap-3">
        {property.listingStats.map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <p className="text-white text-lg font-bold">{stat.value}</p>
            <p className="text-white/50 text-xs capitalize">{stat.label}</p>
          </div>
        ))}
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
          <p className="text-white text-lg font-bold">{property.inventoryAvailable}</p>
          <p className="text-white/50 text-xs">Units Available</p>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2">
        <h2 className="text-white font-semibold text-sm">About this Property</h2>
        <p className="text-white/60 text-sm leading-relaxed">{property.description}</p>
      </div>

      {/* Documents */}
      {property.documents && property.documents.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Documents</h2>
          <div className="space-y-2">
            {property.documents.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
              >
                <RiFileTextLine className="text-accent h-5 w-5 shrink-0" />
                <span className="text-white/80 text-sm hover:text-white">{doc.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {property.milestones && property.milestones.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <h2 className="text-white font-semibold text-sm mb-3">Development Milestones</h2>
          <div className="space-y-3">
            {property.milestones
              .sort((a, b) => a.order - b.order)
              .map((ms) => (
                <div key={ms.id} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    ms.status === 'completed'
                      ? 'bg-green-600/20 text-green-400'
                      : ms.status === 'in_progress'
                      ? 'bg-accent/20 text-accent'
                      : 'bg-white/10 text-white/40'
                  }`}>
                    {ms.status === 'completed' ? <RiCheckLine className="h-3.5 w-3.5" /> : <span className="w-2 h-2 rounded-full bg-current" />}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">{ms.title}</p>
                    {ms.description && <p className="text-white/50 text-xs mt-0.5">{ms.description}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Invest CTA */}
      {property.status === 'published' && property.inventoryAvailable > 0 && (
        <div className="sticky bottom-20 lg:bottom-6">
          {kycApproved ? (
            <Button className="w-full" size="lg" onClick={() => setInvestOpen(true)}>
              Invest Now
            </Button>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3">
              <RiAlertLine className="text-amber-400 h-5 w-5 shrink-0" />
              <p className="text-amber-400 text-sm flex-1">Complete KYC to invest.</p>
              <Link to="/investor/kyc">
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-black">
                  Complete KYC
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Invest Dialog */}
      <Dialog open={investOpen} onOpenChange={setInvestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {property.title}</DialogTitle>
            <DialogDescription>
              Choose the number of units and confirm with your transaction PIN.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Number of Units</Label>
              <Input
                type="number"
                min={1}
                max={property.inventoryAvailable}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Price per unit</span>
                <span className="text-white">{formatCurrency(pricePerUnit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Units</span>
                <span className="text-white">× {quantity}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold pt-1 border-t border-white/10 mt-1">
                <span className="text-white">Total</span>
                <span className="text-accent">{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Transaction PIN</Label>
              <Input
                type="password"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvestOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvest}
              disabled={investMutation.isPending || pin.length < 4}
            >
              {investMutation.isPending ? 'Processing...' : 'Confirm Investment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
