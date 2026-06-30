import { api } from '@/lib/fetchClient';
import type { Property, PaginatedResponse, ApiResponse } from '@/types';

export interface PropertyFilters {
  // Investment model (fractional/outright/land_banking/save_to_own/co_development).
  // Query param name `type` is confirmed via the Postman collection.
  type?: string;
  // `propertyKind` and `returnType` are confirmed real Property fields (seen on a
  // live list-item response), but the public list endpoint's Postman example only
  // documents `type/search/sort/page/limit`. Sent optimistically — harmless if the
  // backend ignores them — and Marketplace.tsx also applies them client-side as a
  // safety net so the filter UI behaves correctly either way.
  propertyKind?: string;
  returnType?: string;
  search?: string;
  sort?: 'popular' | 'price_asc' | 'price_desc' | 'name_asc';
  page?: number;
  limit?: number;
}

export const propertiesApi = {
  list: (filters: PropertyFilters = {}): Promise<PaginatedResponse<Property>> => {
    const params = new URLSearchParams();
    if (filters.type) params.set('type', filters.type);
    if (filters.propertyKind) params.set('propertyKind', filters.propertyKind);
    if (filters.returnType) params.set('returnType', filters.returnType);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    return api.get<PaginatedResponse<Property>>(`/properties?${params}`);
  },

  getById: (propertyId: string): Promise<ApiResponse<Property>> =>
    api.get<ApiResponse<Property>>(`/properties/${propertyId}`),

  getBySlug: (slug: string): Promise<ApiResponse<Property>> =>
    api.get<ApiResponse<Property>>(`/properties/by-slug/${slug}`),

  outrightCheckoutPreview: (
    propertyId: string,
    quantity: number
  ): Promise<ApiResponse<{ totalAmount: number; breakdown: Record<string, number> }>> =>
    api.get(`/properties/${propertyId}/outright-checkout-preview?quantity=${quantity}`),
};
