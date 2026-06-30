import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoritesApi } from '@/api/favorites.api';
import { queryKeys } from '@/lib/queryKeys';

export function useFavoriteIds() {
  const query = useQuery({
    queryKey: queryKeys.favorites.ids,
    queryFn: () => favoritesApi.getIds().then((r) => r.data),
    staleTime: 60_000,
  });

  return { favoriteIds: query.data ?? [], isLoading: query.isLoading };
}

export function useFavoritesList(page = 1, limit = 10) {
  const query = useQuery({
    queryKey: queryKeys.favorites.list(page),
    queryFn: () => favoritesApi.list(page, limit),
  });

  return {
    favorites: query.data?.data ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
  };
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, isFavorited }: { propertyId: string; isFavorited: boolean }) =>
      isFavorited ? favoritesApi.remove(propertyId) : favoritesApi.add(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.ids });
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.list(1) });
    },
  });
}
