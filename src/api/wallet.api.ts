import { api } from '@/lib/fetchClient';
import type { Wallet, Transaction, BankAccount, Bank, ResolvedBankAccount, PaginatedResponse, ApiResponse } from '@/types';

export interface TxApiFilters {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  status?: string;
  direction?: string;
}

export const walletApi = {
  getWallet: (): Promise<Wallet> => api.get<Wallet>('/wallet/me'),

  getTransactions: async (page = 1, limit = 10, filters?: TxApiFilters): Promise<PaginatedResponse<Transaction>> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters?.dateRange) params.set('dateRange', filters.dateRange);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.type) params.set('type', filters.type);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.direction) params.set('direction', filters.direction);
    const raw = await api.get<{ data: Transaction[]; meta: PaginatedResponse<Transaction>['pagination'] }>(`/wallet/transactions?${params}`);
    return { data: raw.data, pagination: raw.meta };
  },

  getTransaction: (transactionId: string): Promise<ApiResponse<Transaction>> =>
    api.get<ApiResponse<Transaction>>(`/wallet/transactions/${transactionId}`),

  getTransactionReceipt: (transactionId: string): Promise<Blob> =>
    api.getBlob(`/wallet/transactions/${transactionId}/receipt`),

  getBanks: (): Promise<Bank[]> =>
    api.get('/wallet/banks'),

  resolveBank: (bankCode: string, accountNumber: string): Promise<ResolvedBankAccount> =>
    api.get(`/wallet/banks/resolve?bankCode=${bankCode}&accountNumber=${accountNumber}`),

  topUp: (payload: {
    amount: number;
    paymentMethod: string;
  }): Promise<Transaction & { payment: { provider: string; publicKey: string; authorizationUrl: string; accessCode: string } }> =>
    api.post('/wallet/top-up', payload),

  verifyTopUp: (reference: string): Promise<ApiResponse<Transaction>> =>
    api.post(`/wallet/top-up/${reference}/verify`),

  withdraw: (payload: {
    amount: number;
    bankAccountId: string;
    transactionPin: string;
  }): Promise<ApiResponse<Transaction>> => api.post('/wallet/withdraw', payload),

  getBankAccounts: (): Promise<BankAccount[]> =>
    api.get<BankAccount[]>('/wallet/bank-accounts'),

  addBankAccount: (payload: {
    shortName: string;
    fullName: string;
    accountNumber: string;
    accountHolderName: string;
    bankCode?: string;
    isPrimary?: boolean;
  }): Promise<ApiResponse<BankAccount>> => api.post('/wallet/bank-accounts', payload),

  removeBankAccount: (bankAccountId: string): Promise<ApiResponse<null>> =>
    api.delete(`/wallet/bank-accounts/${bankAccountId}`),

  getPinStatus: (): Promise<import('@/types').TransactionPinStatus> =>
    api.get('/wallet/transaction-pin/status'),

  setPin: (payload: { pin: string }): Promise<ApiResponse<null>> =>
    api.post('/wallet/transaction-pin', payload),
};
