/**
 * Type Definitions for Malabar Finance MVP
 */

import { Decimal } from '@prisma/client/runtime/library'

// ==================== BILLING CYCLE TYPES ====================

export interface BillingCyclePattern {
  typicalCycleLength: number // Days (28-31)
  statementDayOfMonth: number | null // Consistent day if applicable (1-31)
  dueDateOffset: number // Days between statement and due date (usually 20-25)
  confidence: number // 0.0-1.0
}

export interface BillingCycleProjection {
  cycleStartDate: Date
  cycleEndDate: Date // Statement closing date
  paymentDueDate: Date
  isProjected: boolean
  confidence: number
}

export interface CashFlowProjection {
  date: Date
  type: 'income' | 'payment_due' | 'statement_close'
  amount: number
  description: string
  creditCardName?: string
  confidence: number
}

// ==================== CREDIT CARD TYPES ====================

export interface CreditCardBalance {
  currentBalance: number
  availableCredit: number
  creditLimit: number
  lastUpdated: Date
  dataSource: 'plaid' | 'manual'
}

export interface CreditCardSummary {
  id: string
  name: string
  issuer: string
  lastFourDigits?: string
  currentBalance: number
  creditLimit: number
  utilizationRate: number
  nextStatementDate: Date
  nextDueDate: Date
  minimumPaymentDue?: number
  confidence: number
}

// ==================== PLAID TYPES ====================

export interface PlaidLiabilitiesData {
  accountId: string
  balances: {
    current: number
    available: number | null
    limit: number | null
  }
  aprs: Array<{
    apr_percentage: number
    apr_type: string
    balance_subject_to_apr: number | null
    interest_charge_amount: number | null
  }>
  last_statement_issue_date: string | null
  last_statement_balance: number | null
  minimum_payment_amount: number | null
  next_payment_due_date: string | null
  last_payment_date: string | null
  last_payment_amount: number | null
  is_overdue: boolean | null
}

export interface PlaidTransactionEnriched {
  transactionId: string
  accountId: string
  amount: number
  date: string
  name: string
  merchantName?: string
  merchantEntityId?: string
  logo?: string
  website?: string
  category: string[]
  categoryId: string
  paymentChannel: string
  location?: {
    address?: string
    city?: string
    region?: string
    postal_code?: string
    country?: string
    lat?: number
    lon?: number
  }
  isPending: boolean
}

// ==================== REWARDS TYPES ====================

export interface RewardsCategoryBonus {
  category: string
  rate: number // Percentage (e.g., 3.0 for 3%)
  cap?: number // Spending cap in dollars
  activeUntil?: Date
}

export interface RotatingCategorySchedule {
  quarter: string // "Q1-2025"
  categories: string[]
  rate: number
  cap: number
  requiresActivation: boolean
}

export interface RewardsCardSummary {
  id: string
  cardName: string
  issuer: string
  baseRewardRate: number
  rewardsCurrency: 'cashback' | 'points' | 'miles'
  categoryBonuses: RewardsCategoryBonus[]
  rotatingCategories?: RotatingCategorySchedule[]
  annualFee: number
  signUpBonus?: {
    amount: number
    requirement: number
    deadline?: Date
    progress: number
  }
}

export interface RewardsRecommendation {
  merchantName: string
  category: string
  recommendedCard: {
    id: string
    name: string
    rewardRate: number
    reasoning: string
  }
  alternativeCards?: Array<{
    id: string
    name: string
    rewardRate: number
  }>
  potentialEarnings: number
  confidence: number
}

// ==================== TAX CATEGORIZATION TYPES ====================

export type IRSScheduleCategory =
  | 'advertising'
  | 'car_and_truck'
  | 'commissions_and_fees'
  | 'contract_labor'
  | 'depreciation'
  | 'employee_benefits'
  | 'insurance'
  | 'interest'
  | 'legal_professional'
  | 'office_expenses'
  | 'rent_lease'
  | 'repairs_maintenance'
  | 'supplies'
  | 'taxes_licenses'
  | 'travel'
  | 'meals'
  | 'utilities'
  | 'wages'
  | 'other'
  | 'personal' // Non-deductible

export interface TaxCategorization {
  category: IRSScheduleCategory
  isDeductible: boolean
  deductiblePercentage: number // 50 for meals, 100 for most others
  confidence: number // 0.0-1.0 (ML confidence score)
  reasoning?: string
  requiresDocumentation: boolean
}

export interface TaxSummary {
  totalBusinessExpenses: number
  totalDeductions: number
  byCategory: Record<IRSScheduleCategory, number>
  uncategorizedCount: number
  lowConfidenceCount: number
  period: {
    start: Date
    end: Date
  }
}

// ==================== SYNC & DATA QUALITY TYPES ====================

export interface SyncStatus {
  lastSync: Date
  status: 'success' | 'error' | 'partial' | 'in_progress'
  recordsProcessed: number
  errorCount: number
  nextScheduledSync?: Date
}

export interface DataQualityMetrics {
  totalAccounts: number
  accountsWithHighConfidence: number
  accountsNeedingAttention: number
  lastSyncAge: number // Hours since last sync
  overallHealthScore: number // 0-100
}

export interface ConfidenceScore {
  overall: number // 0.0-1.0
  factors: {
    dataSource: 'plaid' | 'inferred' | 'manual'
    dataAge: number // Hours
    patternConsistency: number // 0.0-1.0
    fieldCompleteness: number // 0.0-1.0
  }
  displayMessage: string
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata?: {
    timestamp: Date
    requestId?: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

// ==================== USER SETTINGS TYPES ====================

export interface UserPreferences {
  industry?: string
  profession?: string
  travelForWork: boolean
  hasBusinessMeals: boolean
  hasHomeOffice: boolean
  defaultPaymentStrategy: 'minimum' | 'statement' | 'full'
  notificationSettings: {
    statementReminders: boolean
    paymentReminders: boolean
    rewardsOptimizationTips: boolean
  }
}

// ==================== UTILITY TYPES ====================

export type DateRange = {
  start: Date
  end: Date
}

export type SortOrder = 'asc' | 'desc'

export type FilterOperator = 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains'
