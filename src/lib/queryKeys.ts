import type { PropertyFilters } from '@/api/properties.api';

export const queryKeys = {
  properties: {
    all: ['properties'] as const,
    list: (filters: PropertyFilters) => ['properties', 'list', filters] as const,
    detail: (id: string) => ['properties', id] as const,
    bySlug: (slug: string) => ['properties', 'slug', slug] as const,
  },
  investments: {
    all: ['investments'] as const,
    list: (page: number) => ['investments', 'list', page] as const,
    detail: (id: string) => ['investments', id] as const,
    performance: (period: string) => ['investments', 'performance', period] as const,
  },
  wallet: {
    me: ['wallet', 'me'] as const,
    transactions: (page: number) => ['wallet', 'transactions', page] as const,
    bankAccounts: ['wallet', 'bank-accounts'] as const,
    banks: ['wallet', 'banks'] as const,
    pinStatus: ['wallet', 'pin-status'] as const,
  },
  kyc: {
    status: ['kyc', 'status'] as const,
  },
  partner: {
    analytics: (period: string) => ['partner', 'analytics', period] as const,
    commissions: (page: number) => ['partner', 'commissions', page] as const,
    wallet: ['partner', 'wallet'] as const,
    properties: (page: number) => ['partner', 'properties', page] as const,
  },
  notifications: {
    // Polled flat list backing the header bell badge — distinct from `list`
    // below so the two queries never collide under the same cache key (a
    // plain useQuery and useInfiniteQuery sharing a key corrupts both).
    feed: ['notifications', 'feed'] as const,
    list: (status: string) => ['notifications', 'list', status] as const,
  },
  exits: {
    eligible: ['exits', 'eligible'] as const,
    list: ['exits', 'list'] as const,
    detail: (id: string) => ['exits', id] as const,
  },
  resales: {
    eligible: ['resales', 'eligible'] as const,
    mine: ['resales', 'mine'] as const,
    detail: (id: string) => ['resales', id] as const,
  },
  favorites: {
    list: (page: number) => ['favorites', 'list', page] as const,
    ids: ['favorites', 'ids'] as const,
  },
  support: {
    list: ['support', 'tickets'] as const,
    detail: (id: string) => ['support', 'tickets', id] as const,
  },
};
