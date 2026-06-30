import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/api/support.api';
import { queryKeys } from '@/lib/queryKeys';

export function useSupportTickets() {
  const query = useQuery({
    queryKey: queryKeys.support.list,
    queryFn: () => supportApi.listTickets().then((r) => r.data),
  });

  return { tickets: query.data ?? [], isLoading: query.isLoading };
}

export function useSupportTicket(ticketId: string | undefined) {
  const query = useQuery({
    queryKey: queryKeys.support.detail(ticketId ?? ''),
    queryFn: () => supportApi.getTicket(ticketId!).then((r) => r.data),
    enabled: !!ticketId,
  });

  return { ticket: query.data, isLoading: query.isLoading };
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.list }),
  });
}

export function useReplyToTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { message: string }) => supportApi.replyToTicket(ticketId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.support.detail(ticketId) }),
  });
}

export function useCloseTicket(ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => supportApi.closeTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.support.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.support.list });
    },
  });
}
