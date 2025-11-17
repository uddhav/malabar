/**
 * Credit Card Summary Component
 * Displays individual credit card information with billing cycle status
 */

'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  formatCardNumber,
  formatDate,
  getDaysUntil,
  getUtilizationColor,
  getConfidenceColor,
  getConfidenceLabel,
  cn,
} from '@/lib/utils/format'

interface CreditCardSummaryProps {
  card: {
    id: string
    name: string
    issuer: string | null
    lastFourDigits?: string | null
    currentBalance: number
    creditLimit: number | null
    utilizationRate: number
    nextStatementDate: Date | string | null
    nextDueDate: Date | string | null
    minimumPaymentDue: number | null
    patternConfidence: number
    connectionStatus: string
    isActive: boolean
  }
}

export function CreditCardSummary({ card }: CreditCardSummaryProps) {
  const hasNextDueDate = card.nextDueDate !== null
  const dueInfo = hasNextDueDate ? getDaysUntil(card.nextDueDate!) : null

  return (
    <Card hover className="relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {card.name}
              </h3>
              {card.lastFourDigits && (
                <span className="text-sm text-gray-500">
                  {formatCardNumber(card.lastFourDigits)}
                </span>
              )}
            </div>
            {card.issuer && (
              <p className="text-sm text-gray-600 mt-0.5">{card.issuer}</p>
            )}
          </div>

          {/* Connection Status Badge */}
          <Badge
            variant={card.connectionStatus === 'active' ? 'success' : 'warning'}
            size="sm"
          >
            {card.connectionStatus === 'active' ? 'Connected' : 'Manual'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Current Balance */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">Current Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(card.currentBalance)}
          </p>
        </div>

        {/* Credit Utilization */}
        {card.creditLimit && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Credit Utilization</p>
              <span
                className={cn(
                  'text-sm font-medium px-2 py-0.5 rounded',
                  getUtilizationColor(card.utilizationRate)
                )}
              >
                {card.utilizationRate}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={cn(
                  'h-2 rounded-full transition-all',
                  card.utilizationRate >= 90
                    ? 'bg-red-500'
                    : card.utilizationRate >= 70
                    ? 'bg-orange-500'
                    : card.utilizationRate >= 50
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                )}
                style={{ width: `${Math.min(card.utilizationRate, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">
                {formatCurrency(card.currentBalance)}
              </span>
              <span className="text-xs text-gray-500">
                {formatCurrency(card.creditLimit)}
              </span>
            </div>
          </div>
        )}

        {/* Next Statement & Due Date */}
        <div className="space-y-2 pt-4 border-t border-gray-200">
          {card.nextStatementDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Next Statement</span>
              <span className="text-sm font-medium text-gray-900">
                {formatDate(card.nextStatementDate, 'short')}
              </span>
            </div>
          )}

          {hasNextDueDate && dueInfo && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Payment Due</span>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {formatDate(card.nextDueDate!, 'short')}
                </p>
                <p
                  className={cn(
                    'text-xs font-medium mt-0.5 px-2 py-0.5 rounded inline-block',
                    dueInfo.colorClass
                  )}
                >
                  {dueInfo.label}
                </p>
              </div>
            </div>
          )}

          {card.minimumPaymentDue !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Minimum Due</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(card.minimumPaymentDue)}
              </span>
            </div>
          )}
        </div>

        {/* Confidence Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Data Confidence</span>
            <span
              className={cn(
                'text-xs font-medium px-2 py-0.5 rounded',
                getConfidenceColor(card.patternConfidence)
              )}
            >
              {getConfidenceLabel(card.patternConfidence)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
