// ─── Auth & User ──────────────────────────────────────────────────────────────
// Note: the backend serializes every entity's id as `id`, not `_id`
// (confirmed via Postman test scripts and live responses) — despite Mongo
// conventions, never assume `_id` exists on a response body.

export type UserRole = 'investor' | 'partner';
export type InvestorType = 'individual' | 'corporate';
export type KYCStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  role: UserRole;
  investorType?: InvestorType;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  employmentStatus?: string;
  avatarUrl?: string;
  nextOfKinName?: string;
  nextOfKinAddress?: string;
  nextOfKinPhone?: string;
  nextOfKinEmail?: string;
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
  images?: PropertyImage[];
  documents?: PropertyDocument[];
  milestones?: Milestone[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Partner promotable-properties context
  commissionRate?: number;
  commissionEarning?: number;
  // Detail-view only fields
  video?: PropertyVideo | null;
  highlights?: PropertyHighlight[];
  howItWorksTitle?: string | null;
  howItWorksSteps?: PropertyHowItWorksStep[];
  managementFees?: PropertyManagementFees | null;
  buildingPermitNumber?: string | null;
  investmentModelConfig?: PropertyInvestmentModelConfig | null;
  keyFacts?: unknown[];
  planTitle?: string | null;
  planMetrics?: unknown[];
  trustItems?: unknown[];
  developmentStage?: string | null;
  developmentStageLabel?: string | null;
  projectStartDate?: string | null;
  projectEndDate?: string | null;
  projectManagerName?: string | null;
  projectManagerContact?: string | null;
  projectManagerImageUrl?: string | null;
}

export interface PropertyImage {
  id: string;
  url: string;
  secureUrl?: string;
  publicId: string;
  isPrimary: boolean;
  altText?: string | null;
  sortOrder?: number;
  originalFilename?: string;
}

export interface PropertyDocument {
  id: string;
  url: string;
  secureUrl?: string;
  name?: string;
  fileName?: string;
  category?: string;
  originalFilename?: string;
  sortOrder?: number;
}

export interface Milestone {
  id: string;
  stepNumber?: number;
  title: string;
  subtitle?: string;
  description?: string;
  status: 'upcoming' | 'pending' | 'in_progress' | 'completed';
  fundingShareLabel?: string;
  targetDate?: string;
  isCurrentStage?: boolean;
  sortOrder?: number;
  completedAt?: string;
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyVideo {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  category: string;
  fileName: string;
  originalFilename: string;
  sortOrder: number;
  createdAt: string;
}

export interface PropertyHighlight {
  label: string;
  iconKey: string;
}

export interface PropertyHowItWorksStep {
  title: string;
  subtitle: string;
}

export interface PropertyManagementFeeItem {
  label: string;
  amount: number;
}

export interface PropertyManagementFees {
  items: PropertyManagementFeeItem[];
  total: number;
}

export interface PropertyInvestmentModelConfig {
  id: string;
  type: string;
  typeLabel: string;
  config: Record<string, unknown>;
}


// ─── Eligible Investment (exits/eligible & resales/eligible response shape) ────

export interface EligibleInvestment {
  investmentId: string;
  title: string;
  location: string;
  propertyImageUrl: string | null;
  investmentType: InvestmentModelType;
  investmentTypeLabel: string;
  quantityOwned: number;
  quantityLabel: string;
  investedAmount: number;
  currentValue: number;
  maturityDate: string | null;
  reservationEndsAt: string | null;
  isEligible: boolean;
  ineligibilityReason: string | null;
}

// ─── Investment ────────────────────────────────────────────────────────────────
// Shape confirmed from a live /investments/me list response.

export type InvestmentStatus =
  | 'active'
  | 'pending'
  | 'completed'
  | 'exited'
  | 'pending_resale';

export interface Investment {
  id: string;
  reference: string;
  title: string;
  location: string;
  type: InvestmentModelType;
  typeLabel: string;
  status: InvestmentStatus;
  statusLabel: string;
  unitsOwnedLabel: string;
  currentValue: number;
  totalReturns: number;
  totalInvested: number;
  totalCommitment: number;
  progressPercent: number;
  progressLabel: string;
  projectMilestoneLabel: string | null;
  reservationPeriodLabel: string | null;
  startedAt: string;
  maturityDate: string | null;
  reservationEndsAt: string | null;
  fractionalSummary: Record<string, unknown> | null;
  propertyImageUrl: string | null;
  // Detail-view only fields (not present on list items)
  milestones?: InvestmentMilestone[];
  handoverDetails?: HandoverDetails;
  createdAt: string;
  // Extended detail-only fields returned by GET /investments/:id
  description?: string | null;
  aboutLabel?: string | null;
  documents?: InvestmentDocument[];
  projectManagerName?: string | null;
  projectManagerContact?: string | null;
  projectManagerImageUrl?: string | null;
  paymentPlan?: string | null;
  paymentFrequency?: string | null;
  nextPaymentDate?: string | null;
  nextPaymentAmount?: number | null;
  remainingInstallmentsLabel?: string | null;
  plotSize?: string | null;
  plotSizeLabel?: string | null;
  numberOfPlots?: number | null;
  projectProgressPercent?: number | null;
  projectEndDate?: string | null;
  projectDurationLabel?: string | null;
  initialPropertyValue?: number | null;
  currentValueNote?: string | null;
  ownershipLabel?: string | null;
  currentDevelopmentStageTitle?: string | null;
  currentDevelopmentStageDate?: string | null;
  lastUpdatedAt?: string | null;
  progressTimeline?: InvestmentProgressStep[];
  progressInfoText?: string | null;
  currentValueChangePercent?: number | null;
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

export interface InvestmentDocument {
  id?: string;
  name: string;
  url: string;
  type?: string;
  sizeLabel?: string;
}

export interface InvestmentProgressStep {
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  date?: string | null;
  subtitle?: string | null;
}

// Shape confirmed from a live /investments/me/performance response.
export interface PortfolioPerformance {
  period: string;
  periodLabel: string;
  totalReturnsPercent: number;
  returnsEarned: number;
  portfolioOccupancyPercent: number;
  occupancyProgress: number;
  totalInvested: number;
  totalPortfolioValue: number;
  activeInvestments: number;
  totalInvestments: number;
}

// ─── Banks ────────────────────────────────────────────────────────────────────

export interface Bank {
  code: string;
  name: string;
  shortName: string;
  fullName: string;
  slug: string;
  logoUrl: string | null;
}

export interface ResolvedBankAccount {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  matchesProfile: boolean;
}

// ─── Wallet & Transactions ─────────────────────────────────────────────────────

export type TransactionType =
  | 'investment_return'
  | 'wallet_top_up'
  | 'referral_bonus'
  | 'investment_in'
  | 'withdrawal'
  | 'admin_credit'
  | 'admin_debit';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface WalletFeeSettings {
  walletTopUpFeeRate: number;
  walletWithdrawalFeeCap: number;
  walletWithdrawalFeeFlat: number;
  walletWithdrawalFeePercent: number;
}

export interface TransactionPinStatus {
  isSet: boolean;
  isLocked: boolean;
  lockedUntil: string | null;
  isPinOperationsBlocked: boolean;
  isPinResetAuthorized: boolean;
  pinResetAuthorizedUntil: string | null;
}

// Shape confirmed from a live /wallet/me response.
export interface Wallet {
  id: string;
  currency: string;
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  hasTransactionPin: boolean;
  feeSettings: WalletFeeSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDetailField {
  label: string;
  value: string;
  highlightValue?: boolean;
}

export interface Transaction {
  id: string;
  reference: string;
  title: string;
  subtitle: string;
  type: TransactionType;
  typeLabel: string;
  status: TransactionStatus;
  statusLabel: string;
  isCredit: boolean;
  amount: number;
  feeAmount: number;
  balanceAfter: number;
  occurredAt: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  // Only present on detail view
  detailFields?: TransactionDetailField[];
}

export interface TxFilterState {
  dateRange: 'all' | 'today' | 'last_7_days' | 'last_30_days' | 'last_3_months' | 'custom';
  dateFrom: string;
  dateTo: string;
  direction: 'all' | 'money_in' | 'money_out';
  status: '' | TransactionStatus;
  type: '' | TransactionType;
}

export const EMPTY_TX_FILTERS: TxFilterState = {
  dateRange: 'all',
  dateFrom: '',
  dateTo: '',
  direction: 'all',
  status: '',
  type: '',
};

export interface BankAccount {
  id: string;
  shortName: string;
  fullName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  bankCode: string;
  logoUrl: string | null;
  accountHolderName: string;
  verificationStatus: 'verified' | 'pending' | 'failed';
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Exit & Resale ─────────────────────────────────────────────────────────────

export type ExitStatus = 'pending' | 'under_review' | 'completed' | 'rejected' | 'cancelled';

export interface ExitRequest {
  id: string;
  reference: string;
  title: string;
  location: string;
  propertyImageUrl: string | null;
  status: ExitStatus;
  statusLabel: string;
  dateLabel: string;
  sharesLabel: string;
  amount: number;
  amountLabel: string;
  isAmountReceived: boolean;
  requestedAt: string;
  processingEligibleAt: string | null;
  investmentId: string;
  propertyId: string;
}

export interface ExitsListResponse {
  data: ExitRequest[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  summary: { completedCount: number; pendingCount: number };
}

export interface ExitTimelineStep {
  title: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp: string;
  subtitle?: string;
}

export interface ExitDetailFinancials {
  totalInvested: number;
  currentValue: number;
  gainBeforeFee: number;
  gainPercent: number;
  exitFee: number;
  exitFeeRate: number;
  payoutAmount: number;
}

export interface ExitDetailDocument {
  id?: string;
  name: string;
  url: string;
  type?: string;
  sizeLabel?: string;
}

export interface ExitDetail {
  id: string;
  reference: string;
  investmentId: string;
  propertyId?: string;
  title: string;
  location: string;
  propertyImageUrl: string | null;
  propertyType?: string;
  status: ExitStatus;
  statusLabel: string;
  dateLabel?: string;
  sharesLabel?: string;
  amount?: number;
  amountLabel?: string;
  isAmountReceived?: boolean;
  ownershipLabel?: string;
  investedOnLabel?: string;
  statusDateLabel?: string;
  requestedAt: string;
  completedAt?: string | null;
  processingEligibleAt?: string | null;
  canComplete?: boolean;
  financials?: ExitDetailFinancials;
  timeline?: ExitTimelineStep[];
  documents?: ExitDetailDocument[];
  rejectionReason?: string | null;
  adminNote?: string | null;
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

export interface ResalesListResponse {
  data: ResaleListing[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  summary: { pendingCount: number; liveCount: number };
}

export interface ResaleDetailFinancials {
  grossAmount: number;
  listingFee: number;
  listingFeeRate?: number;
  processingFee: number;
  processingFeeRate?: number;
  netPayout: number;
}

export interface ResaleDetail {
  id: string;
  reference: string;
  investmentId: string;
  title: string;
  location: string;
  propertyImageUrl: string | null;
  investmentType?: string;
  investmentTypeLabel?: string;
  status: ResaleStatus;
  statusLabel: string;
  quantity: number;
  quantityLabel?: string;
  minPricePerUnit: number;
  maxPricePerUnit: number;
  financials?: ResaleDetailFinancials;
  rejectionReason?: string | null;
  listedAt?: string | null;
  createdAt: string;
}

// ─── KYC ──────────────────────────────────────────────────────────────────────

export interface KYCStatusResponse {
  status: KYCStatus;
  statusLabel?: string;
  verificationKind?: string;
  verificationTitle?: string;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

// ─── Partner ──────────────────────────────────────────────────────────────────

export interface CommissionWallet {
  id: string;
  currency: string;
  availableBalance: number;
  pendingCommissions: number;
  totalEarned: number;
  paidOut: number;
  minimumPayout: number;
  payoutFeePercent: number;
  updatedAt: string;
}

export interface CommissionEntry {
  id: string;
  type: 'earned' | 'payout';
  amount: number;
  feeAmount: number;
  status: string;
  reference: string;
  occurredAt: string;
  processedAt?: string | null;
  propertyTitle: string;
  location?: string | null;
  propertyImageUrl?: string | null;
  subtitle: string;
  investorName?: string | null;
  investmentAmount?: number | null;
  commissionRate?: number | null;
  leadSource?: string | null;
  payoutAccount?: unknown | null;
  processingFee?: number | null;
}

export interface ReferralAnalytics {
  totalClicks: number;
  totalShares?: number;
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
