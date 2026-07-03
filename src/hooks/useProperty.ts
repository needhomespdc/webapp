import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/api/properties.api';
import { queryKeys } from '@/lib/queryKeys';
import type { PropertyFilters } from '@/api/properties.api';

export function usePropertyList(filters: PropertyFilters = {}) {
  const query = useQuery({
    queryKey: queryKeys.properties.list(filters),
    queryFn: () => propertiesApi.list(filters),
    staleTime: 5 * 60_000,
  });

  return {
    properties: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function usePropertyBySlug(slug: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.properties.bySlug(slug ?? ''),
    queryFn: async () => {
      const res = await propertiesApi.getBySlug(slug!);
      // Some endpoints return { success, message, data: T }, others return T directly.
      // Check for envelope shape and unwrap defensively.
      if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
        return (res as { data: import('@/types').Property }).data;
      }
      return res as unknown as import('@/types').Property;
    },
    enabled: !!slug,
    staleTime: 5 * 60_000,
  });

  return {
    property: query.data,
    isLoading: query.isLoading,
    error: query.error,
  };
}
