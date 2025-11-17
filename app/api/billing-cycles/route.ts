/**
 * Get billing cycles for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { startOfMonth, endOfMonth, addMonths } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const creditCardId = searchParams.get('creditCardId')

    // TODO: Replace with actual NextAuth session once implemented
    // const session = await getServerSession()
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }
    // const userId = session.user.id

    // TEMPORARY: Use first user or create demo user
    let user = await prisma.user.findFirst()
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'demo@malabar.finance',
          name: 'Demo User',
        },
      })
    }
    const userId = user.id

    // Default to showing 3 months: 1 month ago to 2 months ahead
    const defaultStartDate = startOfMonth(addMonths(new Date(), -1))
    const defaultEndDate = endOfMonth(addMonths(new Date(), 2))

    // Build where clause
    const where: any = {
      userId,
      cycleEndDate: {
        gte: startDate ? new Date(startDate) : defaultStartDate,
        lte: endDate ? new Date(endDate) : defaultEndDate,
      },
    }

    if (creditCardId) {
      where.creditCardId = creditCardId
    }

    // Fetch billing cycles
    const billingCycles = await prisma.billingCycle.findMany({
      where,
      include: {
        creditCard: {
          select: {
            id: true,
            name: true,
            issuer: true,
            lastFourDigits: true,
          },
        },
      },
      orderBy: [
        { cycleEndDate: 'asc' },
        { creditCard: { name: 'asc' } },
      ],
    })

    // Transform data for frontend
    const cyclesFormatted = billingCycles.map(cycle => ({
      id: cycle.id,
      creditCard: {
        id: cycle.creditCard.id,
        name: cycle.creditCard.name,
        issuer: cycle.creditCard.issuer || 'Unknown',
        lastFourDigits: cycle.creditCard.lastFourDigits,
      },
      cycleStartDate: cycle.cycleStartDate.toISOString(),
      cycleEndDate: cycle.cycleEndDate.toISOString(),
      paymentDueDate: cycle.paymentDueDate.toISOString(),
      statementBalance: cycle.statementBalance ? Number(cycle.statementBalance) : null,
      minimumPaymentDue: cycle.minimumPaymentDue ? Number(cycle.minimumPaymentDue) : null,
      isPaid: cycle.isPaid,
      isOverdue: cycle.isOverdue,
      isProjected: cycle.isProjected,
      confidence: cycle.confidence,
      dataSource: cycle.dataSource,
    }))

    // Group cycles by month for easier rendering
    const cyclesByMonth: Record<string, typeof cyclesFormatted> = {}
    cyclesFormatted.forEach(cycle => {
      const monthKey = cycle.cycleEndDate.substring(0, 7) // YYYY-MM
      if (!cyclesByMonth[monthKey]) {
        cyclesByMonth[monthKey] = []
      }
      cyclesByMonth[monthKey].push(cycle)
    })

    return NextResponse.json({
      success: true,
      data: {
        cycles: cyclesFormatted,
        cyclesByMonth,
      },
      metadata: {
        totalCycles: cyclesFormatted.length,
        dateRange: {
          start: startDate || defaultStartDate.toISOString(),
          end: endDate || defaultEndDate.toISOString(),
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching billing cycles:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_CYCLES_ERROR',
          message: error.message || 'Failed to fetch billing cycles',
        },
      },
      { status: 500 }
    )
  }
}
