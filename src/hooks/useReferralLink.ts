import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';

export function useReferralLink(propertySlug: string) {
  const { user } = useAuth();
  const baseUrl = window.location.origin;
  const link = `${baseUrl}/investor/marketplace/${propertySlug}?ref=${user?.referralCode ?? ''}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  return { link, copy };
}
