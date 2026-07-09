import { api } from '@/lib/fetchClient';
import type { Wallet, Transaction, BankAccount, Bank, ResolvedBankAccount, PaginatedResponse, ApiResponse } from '@/types';

export const walletApi = {
  getWallet: (): Promise<Wallet> => api.get<Wallet>('/wallet/me'),

  getTransactions: (page = 1, limit = 10): Promise<PaginatedResponse<Transaction>> =>
    api.get<PaginatedResponse<Transaction>>(`/wallet/transactions?page=${page}&limit=${limit}`),

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
