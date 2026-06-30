import { api } from '@/lib/fetchClient';
import type { ApiResponse } from '@/types';

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: SupportMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  createdAt: string;
}

export const supportApi = {
  listTickets: (): Promise<ApiResponse<SupportTicket[]>> =>
    api.get<ApiResponse<SupportTicket[]>>('/support/tickets'),

  createTicket: (payload: { subject: string; message: string }): Promise<ApiResponse<SupportTicket>> =>
    api.post<ApiResponse<SupportTicket>>('/support/tickets', payload),

  getTicket: (supportTicketId: string): Promise<ApiResponse<SupportTicket>> =>
    api.get<ApiResponse<SupportTicket>>(`/support/tickets/${supportTicketId}`),

  replyToTicket: (
    supportTicketId: string,
    payload: { message: string }
  ): Promise<ApiResponse<SupportMessage>> =>
    api.post<ApiResponse<SupportMessage>>(`/support/tickets/${supportTicketId}/messages`, payload),

  closeTicket: (supportTicketId: string): Promise<ApiResponse<null>> =>
    api.post<ApiResponse<null>>(`/support/tickets/${supportTicketId}/close`),
};
