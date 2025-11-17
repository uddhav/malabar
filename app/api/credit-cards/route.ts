/**
 * Get all credit cards for the authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with actual NextAuth session once implemented
    // For now, we'll use a mock user ID for development
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

    // Fetch all credit cards for the user
    const creditCards = await prisma.creditCard.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        plaidItem: {
          select: {
            institutionName: true,
            status: true,
            lastSuccessfulSync: true,
          },
        },
        billingCycles: {
          where: {
            cycleEndDate: {
              gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            },
          },
          orderBy: {
            cycleEndDate: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform data for frontend
    const cardsWithSummary = creditCards.map(card => {
      const latestCycle = card.billingCycles[0]
      const utilizationRate = card.creditLimit
        ? (Number(card.currentBalance) / Number(card.creditLimit)) * 100
        : 0

      return {
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        lastFourDigits: card.lastFourDigits,
        currentBalance: Number(card.currentBalance) || 0,
        availableCredit: card.availableCredit ? Number(card.availableCredit) : null,
        creditLimit: card.creditLimit ? Number(card.creditLimit) : null,
        utilizationRate: Math.round(utilizationRate),
        nextStatementDate: latestCycle?.cycleEndDate || null,
        nextDueDate: latestCycle?.paymentDueDate || null,
        minimumPaymentDue: latestCycle?.minimumPaymentDue
          ? Number(latestCycle.minimumPaymentDue)
          : null,
        patternConfidence: card.patternConfidence,
        lastSync: card.plaidItem?.lastSuccessfulSync || null,
        connectionStatus: card.plaidItem?.status || 'manual',
        isActive: card.isActive,
      }
    })

    return NextResponse.json({
      success: true,
      data: cardsWithSummary,
      metadata: {
        totalCards: cardsWithSummary.length,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Error fetching credit cards:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_CARDS_ERROR',
          message: error.message || 'Failed to fetch credit cards',
        },
      },
      { status: 500 }
    )
  }
}
