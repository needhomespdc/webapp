import { api, unwrapEnvelope } from '@/lib/fetchClient';
import type { ApiResponse } from '@/types';

export interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  createdAt: string;
}

// Shape from GET /support/tickets (list — no messages array)
export interface SupportTicket {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

// Shape from GET /support/tickets/:id (detail — includes messages)
export interface SupportTicketDetail {
  id: string;
  reference: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export const supportApi = {
  listTickets: (): Promise<SupportTicket[]> =>
    api.get<unknown>('/support/tickets').then(unwrapEnvelope<SupportTicket[]>),

  createTicket: (payload: {
    subject: string;
    message: string;
  }): Promise<ApiResponse<SupportTicketDetail>> =>
    api.post<ApiResponse<SupportTicketDetail>>('/support/tickets', payload),

  getTicket: (supportTicketId: string): Promise<SupportTicketDetail> =>
    api.get<unknown>(`/support/tickets/${supportTicketId}`).then(unwrapEnvelope<SupportTicketDetail>),

  replyToTicket: (
    supportTicketId: string,
    payload: { message: string }
  ): Promise<ApiResponse<SupportMessage>> =>
    api.post<ApiResponse<SupportMessage>>(`/support/tickets/${supportTicketId}/messages`, payload),

  closeTicket: (supportTicketId: string): Promise<ApiResponse<null>> =>
    api.post<ApiResponse<null>>(`/support/tickets/${supportTicketId}/close`),
};
