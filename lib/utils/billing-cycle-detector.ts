/**
 * Billing Cycle Pattern Detection Algorithm
 *
 * Analyzes historical billing cycle data to detect patterns and project future cycles.
 * Handles edge cases like month-end adjustments, variable cycle lengths, and missing data.
 */

import { differenceInDays, addDays, addMonths, setDate, endOfMonth, startOfDay } from 'date-fns'
import type { BillingCyclePattern, BillingCycleProjection } from '@/types'

interface HistoricalCycle {
  statementDate: Date
  dueDate: Date
  statementBalance?: number
}

interface PatternAnalysisResult {
  pattern: BillingCyclePattern
  quality: 'high' | 'medium' | 'low'
  insights: string[]
}

/**
 * Analyze historical billing cycles to detect patterns
 */
export function analyzeBillingCyclePattern(
  historicalCycles: HistoricalCycle[]
): PatternAnalysisResult {
  const insights: string[] = []

  // Need at least 2 cycles to detect a pattern
  if (historicalCycles.length < 2) {
    return {
      pattern: {
        typicalCycleLength: 30,
        statementDayOfMonth: null,
        dueDateOffset: 21,
        confidence: 0.3,
      },
      quality: 'low',
      insights: ['Insufficient historical data. Need at least 2 billing cycles.'],
    }
  }

  // Sort cycles by statement date
  const sortedCycles = [...historicalCycles].sort(
    (a, b) => a.statementDate.getTime() - b.statementDate.getTime()
  )

  // Calculate cycle lengths (days between consecutive statements)
  const cycleLengths: number[] = []
  for (let i = 1; i < sortedCycles.length; i++) {
    const length = differenceInDays(
      sortedCycles[i].statementDate,
      sortedCycles[i - 1].statementDate
    )
    cycleLengths.push(length)
  }

  // Calculate typical cycle length (mode or median)
  const typicalCycleLength = calculateMode(cycleLengths) || calculateMedian(cycleLengths)

  // Check if cycle length is consistent
  const cycleLengthVariance = calculateVariance(cycleLengths)
  const isConsistentLength = cycleLengthVariance < 4 // Less than 2 days std deviation

  if (isConsistentLength) {
    insights.push(`Consistent billing cycle of ${typicalCycleLength} days`)
  } else {
    insights.push(`Variable billing cycle (${Math.min(...cycleLengths)}-${Math.max(...cycleLengths)} days)`)
  }

  // Analyze statement day of month
  const statementDays = sortedCycles.map(c => c.statementDate.getDate())
  const mostCommonDay = calculateMode(statementDays)

  // Check if statement day is consistent (accounting for month-end variations)
  const isConsistentDay = checkStatementDayConsistency(sortedCycles)
  const statementDayOfMonth = isConsistentDay ? mostCommonDay : null

  if (isConsistentDay && mostCommonDay) {
    insights.push(`Statements typically close on day ${mostCommonDay} of the month`)
  } else {
    insights.push('Statement dates vary by month')
  }

  // Calculate due date offset (days between statement and due date)
  const dueDateOffsets: number[] = sortedCycles.map(cycle =>
    differenceInDays(cycle.dueDate, cycle.statementDate)
  )
  const dueDateOffset = Math.round(calculateMedian(dueDateOffsets))

  const isConsistentOffset = calculateVariance(dueDateOffsets) < 4
  if (isConsistentOffset) {
    insights.push(`Payment typically due ${dueDateOffset} days after statement`)
  } else {
    insights.push('Due date offset varies between cycles')
  }

  // Calculate confidence score
  let confidence = 0.5 // Base confidence

  // Add confidence for data quantity
  if (historicalCycles.length >= 6) confidence += 0.2
  else if (historicalCycles.length >= 3) confidence += 0.1

  // Add confidence for pattern consistency
  if (isConsistentLength) confidence += 0.15
  if (isConsistentDay) confidence += 0.1
  if (isConsistentOffset) confidence += 0.05

  confidence = Math.min(confidence, 1.0)

  // Determine quality
  let quality: 'high' | 'medium' | 'low'
  if (confidence >= 0.8 && historicalCycles.length >= 6) {
    quality = 'high'
  } else if (confidence >= 0.6 && historicalCycles.length >= 3) {
    quality = 'medium'
  } else {
    quality = 'low'
  }

  return {
    pattern: {
      typicalCycleLength,
      statementDayOfMonth,
      dueDateOffset,
      confidence,
    },
    quality,
    insights,
  }
}

/**
 * Project future billing cycles based on detected pattern
 */
export function projectFutureCycles(
  lastKnownCycle: HistoricalCycle,
  pattern: BillingCyclePattern,
  monthsAhead: number = 6
): BillingCycleProjection[] {
  const projections: BillingCycleProjection[] = []
  let currentStatementDate = lastKnownCycle.statementDate

  for (let i = 0; i < monthsAhead; i++) {
    // Calculate next statement date
    let nextStatementDate: Date

    if (pattern.statementDayOfMonth !== null) {
      // Use consistent day of month (with month-end handling)
      nextStatementDate = addMonths(currentStatementDate, 1)
      nextStatementDate = adjustForMonthEnd(nextStatementDate, pattern.statementDayOfMonth)
    } else {
      // Use typical cycle length
      nextStatementDate = addDays(currentStatementDate, pattern.typicalCycleLength)
    }

    // Calculate cycle start (day after previous statement)
    const cycleStartDate = addDays(currentStatementDate, 1)

    // Calculate due date
    const paymentDueDate = addDays(nextStatementDate, pattern.dueDateOffset)

    projections.push({
      cycleStartDate: startOfDay(cycleStartDate),
      cycleEndDate: startOfDay(nextStatementDate),
      paymentDueDate: startOfDay(paymentDueDate),
      isProjected: true,
      confidence: pattern.confidence * (1 - i * 0.05), // Confidence degrades with distance
    })

    currentStatementDate = nextStatementDate
  }

  return projections
}

/**
 * Detect if a transaction falls within a specific billing cycle
 */
export function assignTransactionToCycle(
  transactionDate: Date,
  cycles: BillingCycleProjection[]
): BillingCycleProjection | null {
  for (const cycle of cycles) {
    if (
      transactionDate >= cycle.cycleStartDate &&
      transactionDate <= cycle.cycleEndDate
    ) {
      return cycle
    }
  }
  return null
}

/**
 * Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
 */
function adjustForMonthEnd(date: Date, targetDay: number): Date {
  const lastDayOfMonth = endOfMonth(date).getDate()

  if (targetDay > lastDayOfMonth) {
    // If target day doesn't exist in this month, use last day
    return setDate(date, lastDayOfMonth)
  } else {
    return setDate(date, targetDay)
  }
}

/**
 * Check if statement days are consistent (accounting for month-end)
 */
function checkStatementDayConsistency(cycles: HistoricalCycle[]): boolean {
  const days = cycles.map(c => c.statementDate.getDate())

  // If all days are the same, it's consistent
  if (new Set(days).size === 1) return true

  // Check if variations are due to month-end adjustments
  const maxDay = Math.max(...days)
  const minDay = Math.min(...days)

  // If difference is <=3 and involves likely month-end, consider consistent
  if (maxDay - minDay <= 3 && maxDay >= 28) {
    return true
  }

  return false
}

// ==================== STATISTICAL UTILITIES ====================

function calculateMode(numbers: number[]): number | null {
  if (numbers.length === 0) return null

  const frequency: Record<number, number> = {}
  numbers.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1
  })

  let maxFreq = 0
  let mode: number | null = null

  Object.entries(frequency).forEach(([num, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq
      mode = Number(num)
    }
  })

  return mode
}

function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  } else {
    return sorted[mid]
  }
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0

  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2))
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length
}

/**
 * Calculate confidence score for a billing cycle
 */
export function calculateCycleConfidence(
  dataSource: 'plaid' | 'inferred' | 'manual',
  dataAgeHours: number,
  patternConfidence: number
): number {
  let confidence = patternConfidence

  // Adjust for data source
  if (dataSource === 'plaid') confidence *= 1.0
  else if (dataSource === 'inferred') confidence *= 0.85
  else confidence *= 0.7 // manual

  // Degrade confidence for stale data
  if (dataAgeHours > 48) {
    confidence *= Math.max(0.5, 1 - (dataAgeHours - 48) / 720) // Degrade over 30 days
  }

  return Math.max(0, Math.min(1, confidence))
}

/**
 * Get user-friendly confidence message
 */
export function getConfidenceMessage(confidence: number): string {
  if (confidence >= 0.85) {
    return 'Updated today from your bank'
  } else if (confidence >= 0.65) {
    return 'Estimated based on your typical cycle pattern'
  } else if (confidence >= 0.45) {
    return 'Projection based on limited data'
  } else {
    return 'Unable to sync. Please verify manually'
  }
}

export default {
  analyzeBillingCyclePattern,
  projectFutureCycles,
  assignTransactionToCycle,
  calculateCycleConfidence,
  getConfidenceMessage,
}
