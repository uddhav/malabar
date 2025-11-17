/**
 * Billing Cycle Calendar Component
 * Visual timeline showing all credit card billing cycles
 */

'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatCurrency,
  formatDate,
  getDaysUntil,
  cn,
} from '@/lib/utils/format'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from 'date-fns'

interface BillingCycle {
  id: string
  creditCard: {
    id: string
    name: string
    issuer: string
    lastFourDigits?: string | null
  }
  cycleStartDate: string
  cycleEndDate: string
  paymentDueDate: string
  statementBalance: number | null
  minimumPaymentDue: number | null
  isPaid: boolean
  isOverdue: boolean
  isProjected: boolean
  confidence: number
  dataSource: string
}

interface BillingCycleCalendarProps {
  cycles: BillingCycle[]
}

export function BillingCycleCalendar({ cycles }: BillingCycleCalendarProps) {
  const today = new Date()
  const currentMonth = useMemo(() => startOfMonth(today), [today])

  // Generate calendar for 3 months: last month, current month, next month
  const months = useMemo(() => {
    return [
      subMonths(currentMonth, 1),
      currentMonth,
      addMonths(currentMonth, 1),
    ]
  }, [currentMonth])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Cycle Timeline</CardTitle>
        <CardDescription>
          View all your credit card statement and payment due dates
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-8">
          {months.map((month, idx) => (
            <MonthView
              key={month.toISOString()}
              month={month}
              cycles={cycles}
              isCurrentMonth={isSameMonth(month, today)}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-3">Legend</p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Statement Closes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600">Payment Due</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-300 border-2 border-gray-400" />
              <span className="text-sm text-gray-600">Projected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MonthView({
  month,
  cycles,
  isCurrentMonth,
}: {
  month: Date
  cycles: BillingCycle[]
  isCurrentMonth: boolean
}) {
  const today = new Date()
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Filter cycles for this month
  const monthCycles = cycles.filter(cycle => {
    const cycleEnd = new Date(cycle.cycleEndDate)
    const dueDate = new Date(cycle.paymentDueDate)
    return isSameMonth(cycleEnd, month) || isSameMonth(dueDate, month)
  })

  // Get events for each day
  const getEventsForDay = (day: Date) => {
    const events: Array<{
      type: 'statement' | 'due'
      cycle: BillingCycle
    }> = []

    monthCycles.forEach(cycle => {
      if (isSameDay(new Date(cycle.cycleEndDate), day)) {
        events.push({ type: 'statement', cycle })
      }
      if (isSameDay(new Date(cycle.paymentDueDate), day)) {
        events.push({ type: 'due', cycle })
      }
    })

    return events
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {format(month, 'MMMM yyyy')}
        {isCurrentMonth && (
          <Badge variant="info" className="ml-2">
            Current
          </Badge>
        )}
      </h3>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {/* Empty cells for days before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Day cells */}
        {days.map(day => {
          const events = getEventsForDay(day)
          const isToday = isSameDay(day, today)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'aspect-square border rounded-lg p-1 relative',
                isToday
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white',
                events.length > 0 && 'hover:shadow-md transition-shadow cursor-pointer'
              )}
            >
              {/* Day number */}
              <div
                className={cn(
                  'text-sm font-medium text-center',
                  isToday ? 'text-blue-600' : 'text-gray-700'
                )}
              >
                {format(day, 'd')}
              </div>

              {/* Events */}
              {events.length > 0 && (
                <div className="mt-1 space-y-1">
                  {events.map((event, idx) => (
                    <EventDot
                      key={`${event.cycle.id}-${event.type}-${idx}`}
                      type={event.type}
                      cycle={event.cycle}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Upcoming Events List */}
      {monthCycles.length > 0 && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Events This Month
          </h4>
          {monthCycles
            .sort((a, b) => {
              const aDate = new Date(a.cycleEndDate)
              const bDate = new Date(b.cycleEndDate)
              return aDate.getTime() - bDate.getTime()
            })
            .map(cycle => (
              <CycleEventCard key={cycle.id} cycle={cycle} />
            ))}
        </div>
      )}
    </div>
  )
}

function EventDot({
  type,
  cycle,
}: {
  type: 'statement' | 'due'
  cycle: BillingCycle
}) {
  const isProjected = cycle.isProjected

  return (
    <div
      className={cn(
        'w-2 h-2 rounded-full mx-auto',
        type === 'statement' ? 'bg-blue-500' : 'bg-red-500',
        isProjected && 'border-2 border-gray-400 bg-white'
      )}
      title={`${cycle.creditCard.name} - ${
        type === 'statement' ? 'Statement Closes' : 'Payment Due'
      }`}
    />
  )
}

function CycleEventCard({ cycle }: { cycle: BillingCycle }) {
  const dueInfo = getDaysUntil(cycle.paymentDueDate)

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">
            {cycle.creditCard.name}
          </p>
          {cycle.isProjected && (
            <Badge variant="default" size="sm">
              Projected
            </Badge>
          )}
          {cycle.isPaid && (
            <Badge variant="success" size="sm">
              Paid
            </Badge>
          )}
        </div>

        <div className="mt-1 space-y-1">
          <p className="text-xs text-gray-600">
            Statement: {formatDate(cycle.cycleEndDate, 'short')}
          </p>
          <p className="text-xs text-gray-600">
            Due: {formatDate(cycle.paymentDueDate, 'short')}
            <span
              className={cn(
                'ml-2 px-1.5 py-0.5 rounded text-xs font-medium',
                dueInfo.colorClass
              )}
            >
              {dueInfo.label}
            </span>
          </p>
        </div>
      </div>

      {cycle.statementBalance !== null && (
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(cycle.statementBalance)}
          </p>
          {cycle.minimumPaymentDue !== null && (
            <p className="text-xs text-gray-600">
              Min: {formatCurrency(cycle.minimumPaymentDue)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
