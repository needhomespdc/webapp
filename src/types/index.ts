// ─── Auth & User ──────────────────────────────────────────────────────────────
// Note: the backend serializes every entity's id as `id`, not `_id`
// (confirmed via Postman test scripts and live responses) — despite Mongo
// conventions, never assume `_id` exists on a response body.

export type UserRole = 'investor' | 'partner';
export type InvestorType = 'individual' | 'corporate';
export type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  role: UserRole;
  investorType?: InvestorType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone: string;
  isEmailVerified: boolean;
  kycStatus: KYCStatus;
  referralCode?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Property & Marketplace ────────────────────────────────────────────────────
// Shape confirmed from a live /properties list-item response — this deviates
// substantially from CLAUDE.md's documented (and unverified) flat shape.

export type InvestmentModelType =
  | 'fractional'
  | 'outright'
  | 'land_banking'
  | 'save_to_own'
  | 'co_development';

export type PropertyKind =
  | 'apartment'
  | 'duplex'
  | 'bungalow'
  | 'terrace'
  | 'commercial'
  | 'land'
  | 'villa'
  | 'house'
  | 'mixed_use';

export type ReturnType = 'rental_yield' | 'capital_appreciation' | 'income_generating';

export type PropertyStatus = 'draft' | 'published' | 'sold_out' | 'closed';

// Generic {value, label} stat pairs the backend computes per investment
// model (e.g. "80% funded" / "1 slots left" for fractional, "₦8M" / "Price"
// for outright) — render these directly instead of deriving per-type logic.
export interface ListingStat {
  value: string;
  label: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  description?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  investmentModelType: InvestmentModelType;
  investmentModelTypeLabel: string;
  propertyKind: PropertyKind;
  propertyKindLabel: string;
  returnType: ReturnType;
  returnTypeLabel: string;
  status: PropertyStatus;
  statusLabel: string;
  allowResale: boolean;
  isHotSelling: boolean;
  isNewListing: boolean;
  minInvestment: number;
  totalPrice: number | null;
  listingStats: ListingStat[];
  progressPercent: number | null;
  inventoryTotal: number;
  inventoryAvailable: number;
  primaryImageUrl: string | null;
  // Confirmed present on list items only; detail-view (GET by id/slug) shape
  // for these is not yet confirmed against a live response — best effort.
  images?: PropertyImage[];
  documents?: PropertyDocument[];
  milestones?: Milestone[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PropertyImage {
  id: string;
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface PropertyDocument {
  id: string;
  url: string;
  name: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  order: number;
}

// ─── Investment ────────────────────────────────────────────────────────────────

export type InvestmentStatus =
  | 'active'
  | 'pending'
  | 'completed'
  | 'exited'
  | 'pending_resale';

export interface Investment {
  id: string;
  userId: string;
  propertyId: string;
  property?: Property;
  modelType: InvestmentModelType;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  status: InvestmentStatus;
  milestones?: InvestmentMilestone[];
  handoverDetails?: HandoverDetails;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentMilestone {
  milestoneId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
}

export interface HandoverDetails {
  handoverDate?: string;
  notes?: string;
}

export interface PortfolioPerformance {
  totalInvested: number;
  totalReturns: number;
  netWorth: number;
  activeCount: number;
  performanceByPeriod: { date: string; value: number }[];
}

// ─── Wallet & Transactions ─────────────────────────────────────────────────────

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'investment'
  | 'commission'
  | 'payout'
  | 'refund';

export type TransactionStatus = 'pending' | 'successful' | 'failed' | 'processing';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  isPinSet: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  fee?: number;
  reference: string;
  paymentMethod?: string;
  status: TransactionStatus;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  shortName: string;
  fullName: string;
  accountNumber: string;
  accountHolderName: string;
  bankCode?: string;
  isPrimary: boolean;
  isVerified: boolean;
}

// ─── Exit & Resale ─────────────────────────────────────────────────────────────

export type ExitStatus = 'pending' | 'completed' | 'rejected' | 'cancelled';

export interface ExitRequest {
  id: string;
  investmentId: string;
  investment?: Investment;
  principalAmount: number;
  penaltyPercent: number;
  penaltyAmount: number;
  finalPayout: number;
  status: ExitStatus;
  termsAccepted: boolean;
  rejectionReason?: string;
  createdAt: string;
}

export type ResaleStatus = 'pending' | 'approved' | 'rejected' | 'sold' | 'cancelled';

export interface ResaleListing {
  id: string;
  investmentId: string;
  investment?: Investment;
  quantity: number;
  minPricePerUnit: number;
  maxPricePerUnit: number;
  status: ResaleStatus;
  rejectionReason?: string;
  createdAt: string;
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export interface KYCStatusResponse {
  status: KYCStatus;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ─── Partner ──────────────────────────────────────────────────────────────────

export interface CommissionWallet {
  id: string;
  partnerId: string;
  balance: number;
  totalEarned: number;
  currency: string;
}

export interface CommissionEntry {
  id: string;
  partnerId: string;
  investmentId: string;
  investorId: string;
  propertyTitle: string;
  commissionAmount: number;
  commissionRate: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

export interface ReferralAnalytics {
  totalClicks: number;
  totalConversions: number;
  totalLifetimeEarnings: number;
  clicksByPeriod: { date: string; clicks: number }[];
}

// ─── Notifications ─────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─── Pagination ────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
