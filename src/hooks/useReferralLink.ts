import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';
import { useReferralTrackingToken } from '@/hooks/usePartner';
import { partnersApi } from '@/api/partners.api';

export function useReferralLink(propertySlug: string, propertyTitle?: string) {
  const { user } = useAuth();
  const referralCode = user?.referralCode ?? '';
  const { trackingToken } = useReferralTrackingToken(propertySlug, user?.role === 'partner' && !!propertySlug);

  const base = `https://needhomes.ng/r/${referralCode.toLowerCase()}/${propertySlug.toLowerCase()}`;
  // The signed token lets the backend attribute clicks securely (?t=, as the mobile app does).
  const link = trackingToken ? `${base}?t=${encodeURIComponent(trackingToken)}` : base;

  const trackShare = (channel: string) => {
    if (!trackingToken && !referralCode) return;
    partnersApi
      .trackReferralEvent({
        ...(trackingToken ? { trackingToken } : { referralCode }),
        eventType: 'share',
        propertySlug,
        propertyTitle,
        channel,
      })
      .catch(() => null);
  };

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
    trackShare('copy');
  };

  return { link, copy, trackShare };
}
