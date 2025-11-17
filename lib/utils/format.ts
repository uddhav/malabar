/**
 * Formatting utilities for UI
 */

import { format, formatDistance, formatRelative } from 'date-fns'

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format date in various styles
 */
export function formatDate(date: Date | string, style: 'short' | 'medium' | 'long' = 'medium'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  switch (style) {
    case 'short':
      return format(dateObj, 'MMM d')
    case 'medium':
      return format(dateObj, 'MMM d, yyyy')
    case 'long':
      return format(dateObj, 'MMMM d, yyyy')
    default:
      return format(dateObj, 'MMM d, yyyy')
  }
}

/**
 * Format date relative to now (e.g., "in 5 days", "2 days ago")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistance(dateObj, new Date(), { addSuffix: true })
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format credit card number (last 4 digits)
 */
export function formatCardNumber(lastFour?: string | null): string {
  if (!lastFour) return ''
  return `•••• ${lastFour}`
}

/**
 * Get confidence color class based on score
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.85) return 'text-green-600 bg-green-50'
  if (confidence >= 0.65) return 'text-blue-600 bg-blue-50'
  if (confidence >= 0.45) return 'text-yellow-600 bg-yellow-50'
  return 'text-red-600 bg-red-50'
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'High'
  if (confidence >= 0.65) return 'Medium'
  if (confidence >= 0.45) return 'Low'
  return 'Very Low'
}

/**
 * Get utilization color class
 */
export function getUtilizationColor(utilization: number): string {
  if (utilization >= 90) return 'text-red-600 bg-red-50'
  if (utilization >= 70) return 'text-orange-600 bg-orange-50'
  if (utilization >= 50) return 'text-yellow-600 bg-yellow-50'
  return 'text-green-600 bg-green-50'
}

/**
 * Get days until date with color coding
 */
export function getDaysUntil(date: Date | string): {
  days: number
  label: string
  colorClass: string
} {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = dateObj.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  let label = ''
  let colorClass = ''

  if (diffDays < 0) {
    label = `${Math.abs(diffDays)} days overdue`
    colorClass = 'text-red-600 bg-red-50'
  } else if (diffDays === 0) {
    label = 'Due today'
    colorClass = 'text-red-600 bg-red-50'
  } else if (diffDays === 1) {
    label = 'Due tomorrow'
    colorClass = 'text-orange-600 bg-orange-50'
  } else if (diffDays <= 3) {
    label = `Due in ${diffDays} days`
    colorClass = 'text-orange-600 bg-orange-50'
  } else if (diffDays <= 7) {
    label = `Due in ${diffDays} days`
    colorClass = 'text-yellow-600 bg-yellow-50'
  } else {
    label = `Due in ${diffDays} days`
    colorClass = 'text-gray-600 bg-gray-50'
  }

  return { days: diffDays, label, colorClass }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Class name utility (simple version of clsx/classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
