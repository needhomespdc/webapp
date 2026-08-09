import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/api/support.api';
import { queryKeys } from '@/lib/queryKeys';
import { useSupportTickets } from './useSupport';
import { useSupportChat } from './useSupportChat';
import type { SupportTicket } from '@/api/support.api';

function findActiveTicket(tickets: SupportTicket[]): SupportTicket | null {
  // Prefer open/in_progress; fall back to the most recent ticket of any status
  return (
    tickets.find((t) => t.status === 'open' || t.status === 'in_progress') ??
    tickets[0] ??
    null
  );
}

export function useChatAdmin() {
  const queryClient = useQueryClient();
  const { tickets, isLoading: isLoadingTickets } = useSupportTickets();

  const activeTicket = findActiveTicket(tickets);
  const isClosed =
    !!activeTicket &&
    (activeTicket.status === 'closed' || activeTicket.status === 'resolved');

  const chat = useSupportChat(activeTicket?.id ?? null);

  // Create first ticket when none exists (or all are closed)
  const createMutation = useMutation({
    mutationFn: (message: string) =>
      supportApi.createTicket({ subject: 'NeedHomes Support Chat', message }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.support.list }),
  });

  const send = useCallback(
    (message: string) => {
      if (!message.trim()) return;
      // If there's an open ticket, reply directly
      if (activeTicket && !isClosed) {
        chat.send(message);
      } else {
        // No ticket yet (or all closed) — create a new one with the message as body
        createMutation.mutate(message);
      }
    },
    [activeTicket, isClosed, chat, createMutation]
  );

  return {
    messages: chat.messages,
    isLoading: isLoadingTickets || chat.isLoadingMessages,
    send,
    isSending: chat.isSending || createMutation.isPending,
    activeTicket,
    isClosed,
    hasHistory: tickets.length > 0,
  };
}
