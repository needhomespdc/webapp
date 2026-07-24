import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { kycApi } from '@/api/kyc.api';
import { queryKeys } from '@/lib/queryKeys';
import { useAuth } from '@/hooks/useAuth';

export function useKYCStatus() {
  const { user, updateProfile } = useAuth();
  const query = useQuery({
    queryKey: queryKeys.kyc.status,
    queryFn: kycApi.getStatus,
  });

  // Sync the live KYC status back into AuthContext so every component
  // that reads user.kycStatus (dashboards, header, profile, property detail)
  // stays in sync without needing their own API calls.
  useEffect(() => {
    if (query.data?.status && query.data.status !== user?.kycStatus) {
      updateProfile({ kycStatus: query.data.status });
    }
  }, [query.data?.status, user?.kycStatus, updateProfile]);

  return { status: query.data, isLoading: query.isLoading, error: query.error };
}

export function useCreateKYCSession() {
  return useMutation({ mutationFn: kycApi.createSession });
}

export function useSubmitKYC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kycApi.submit,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status }),
  });
}

export function useVerifyNIN() {
  return useMutation({ mutationFn: kycApi.verifyNIN });
}

export function useVerifyLiveness() {
  return useMutation({ mutationFn: kycApi.verifyLiveness });
}

export function useCorporateVerifyAccountManager() {
  return useMutation({ mutationFn: kycApi.corporateVerifyAccountManager });
}

export function useCorporateSubmitCAC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: kycApi.corporateSubmitCAC,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.kyc.status }),
  });
}
