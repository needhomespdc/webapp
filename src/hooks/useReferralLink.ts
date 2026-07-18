import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/useToast';

export function useReferralLink(propertySlug: string) {
  const { user } = useAuth();
  const link = `https://needhomes.ng/r/${(user?.referralCode ?? '').toLowerCase()}/${propertySlug.toLowerCase()}`;

  const copy = () => {
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  return { link, copy };
}
