/**
 * Dashboard Page
 * Main dashboard showing credit card summaries and billing cycle calendar
 */

'use client'

import { useEffect, useState } from 'react'
import { CreditCardSummary } from '@/components/dashboard/credit-card-summary'
import { BillingCycleCalendar } from '@/components/dashboard/billing-cycle-calendar'
import { Card, CardContent } from '@/components/ui/card'

interface CreditCard {
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

export default function DashboardPage() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([])
  const [billingCycles, setBillingCycles] = useState<BillingCycle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch credit cards and billing cycles in parallel
        const [cardsResponse, cyclesResponse] = await Promise.all([
          fetch('/api/credit-cards'),
          fetch('/api/billing-cycles'),
        ])

        if (!cardsResponse.ok || !cyclesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const cardsData = await cardsResponse.json()
        const cyclesData = await cyclesResponse.json()

        if (cardsData.success) {
          setCreditCards(cardsData.data)
        }

        if (cyclesData.success) {
          setBillingCycles(cyclesData.data.cycles)
        }
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message || 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <DashboardLoading />
  }

  if (error) {
    return <DashboardError error={error} />
  }

  if (creditCards.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Track your credit card billing cycles and payments
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Balance"
            value={`$${creditCards
              .reduce((sum, card) => sum + card.currentBalance, 0)
              .toFixed(2)}`}
            subtitle={`Across ${creditCards.length} card${
              creditCards.length !== 1 ? 's' : ''
            }`}
          />
          <StatCard
            title="Next Payment"
            value={getNextPaymentDate(creditCards)}
            subtitle={getNextPaymentCard(creditCards)}
          />
          <StatCard
            title="Upcoming This Month"
            value={`${getUpcomingThisMonth(billingCycles)} payment${
              getUpcomingThisMonth(billingCycles) !== 1 ? 's' : ''
            }`}
            subtitle="Due this month"
          />
        </div>

        {/* Billing Cycle Calendar */}
        <div className="mb-8">
          <BillingCycleCalendar cycles={billingCycles} />
        </div>

        {/* Credit Cards Grid */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Credit Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creditCards.map(card => (
              <CreditCardSummary key={card.id} card={card} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string
  value: string
  subtitle: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  )
}

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading your dashboard...</p>
      </div>
    </div>
  )
}

function DashboardError({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="text-red-600 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </CardContent>
      </Card>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              No Credit Cards Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Connect your bank accounts to start tracking your credit card
              billing cycles and optimize your payments.
            </p>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              Connect Bank Account
            </button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

// Helper functions
function getNextPaymentDate(cards: CreditCard[]): string {
  const upcomingDueDates = cards
    .filter(card => card.nextDueDate)
    .map(card => new Date(card.nextDueDate!))
    .sort((a, b) => a.getTime() - b.getTime())

  if (upcomingDueDates.length === 0) return 'None scheduled'

  const nextDate = upcomingDueDates[0]
  const today = new Date()
  const diffMs = nextDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 0) return 'Overdue'
  return `In ${diffDays} days`
}

function getNextPaymentCard(cards: CreditCard[]): string {
  const sortedCards = cards
    .filter(card => card.nextDueDate)
    .sort(
      (a, b) =>
        new Date(a.nextDueDate!).getTime() - new Date(b.nextDueDate!).getTime()
    )

  if (sortedCards.length === 0) return 'No upcoming payments'
  return sortedCards[0].name
}

function getUpcomingThisMonth(cycles: BillingCycle[]): number {
  const today = new Date()
  const thisMonth = today.getMonth()
  const thisYear = today.getFullYear()

  return cycles.filter(cycle => {
    const dueDate = new Date(cycle.paymentDueDate)
    return (
      dueDate.getMonth() === thisMonth &&
      dueDate.getFullYear() === thisYear &&
      !cycle.isPaid &&
      dueDate >= today
    )
  }).length
}
