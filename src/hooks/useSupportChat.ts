import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supportApi, type SupportMessage } from '@/api/support.api';
import { createSupportSocket, type AppSocket } from '@/lib/socket';
import { getAccessToken, unwrapEnvelope } from '@/lib/fetchClient';
import type { SupportMessagePayload } from '@/types/socket.types';

export function useSupportChat(ticketId: string | null) {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const socketRef = useRef<AppSocket | null>(null);
  // IDs of messages we sent via REST — skip when the socket echoes them back
  const seenIds = useRef(new Set<string>());

  // Fetch initial messages whenever the open ticket changes
  useEffect(() => {
    if (!ticketId) {
      setMessages([]);
      seenIds.current.clear();
      return;
    }

    setIsLoadingMessages(true);
    seenIds.current.clear();

    supportApi
      .getTicket(ticketId)
      .then((ticket) => {
        setMessages(ticket.messages ?? []);
      })
      .catch(() => {})
      .finally(() => setIsLoadingMessages(false));
  }, [ticketId]);

  // Socket connection — one socket per open ticket
  useEffect(() => {
    if (!ticketId) return;

    const token = getAccessToken();
    if (!token) return;

    const socket = createSupportSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_ticket', ticketId);
    });

    socket.on('support_message', (payload: SupportMessagePayload) => {
      const msg = payload.message;
      // Skip echo of messages we already added on REST success
      if (seenIds.current.has(msg.id)) {
        seenIds.current.delete(msg.id);
        return;
      }
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.emit('leave_ticket', ticketId);
      socket.off('connect');
      socket.off('support_message');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [ticketId]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => supportApi.replyToTicket(ticketId!, { message }),
    onSuccess: (res) => {
      const msg = unwrapEnvelope<SupportMessage>(res);
      // Track this ID so the socket echo is ignored
      seenIds.current.add(msg.id);
      setMessages((prev) => [...prev, msg]);
    },
  });

  const send = useCallback(
    (message: string) => {
      if (!ticketId || !message.trim()) return;
      sendMutation.mutate(message);
    },
    [ticketId, sendMutation]
  );

  return {
    messages,
    isLoadingMessages,
    send,
    isSending: sendMutation.isPending,
  };
}
