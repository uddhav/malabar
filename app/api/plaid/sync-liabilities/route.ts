/**
 * Sync Credit Card Liabilities Data from Plaid
 *
 * Fetches billing cycle data including statement dates, due dates,
 * balances, and payment information
 */

import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { analyzeBillingCyclePattern, projectFutureCycles } from '@/lib/utils/billing-cycle-detector'
import { differenceInHours } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const body = await request.json()
    const { plaidItemId } = body

    // Get Plaid item from database
    const plaidItem = await prisma.plaidItem.findUnique({
      where: { id: plaidItemId, userId },
    })

    if (!plaidItem) {
      return NextResponse.json(
        { error: 'Plaid item not found' },
        { status: 404 }
      )
    }

    // Fetch liabilities data from Plaid
    const liabilitiesResponse = await plaidClient.liabilitiesGet({
      access_token: plaidItem.plaidAccessToken,
    })

    const accounts = liabilitiesResponse.data.accounts
    const liabilities = liabilitiesResponse.data.liabilities.credit

    let recordsUpdated = 0
    let billingCyclesCreated = 0
    let errors = 0

    // Process each credit card account
    for (const account of accounts) {
      if (account.type !== 'credit') continue

      const liability = liabilities?.find(
        (l: any) => l.account_id === account.account_id
      )

      if (!liability) {
        console.warn(`No liability data for account ${account.account_id}`)
        errors++
        continue
      }

      // Find credit card in database
      const creditCard = await prisma.creditCard.findUnique({
        where: { plaidAccountId: account.account_id },
        include: {
          billingCycles: {
            orderBy: { cycleEndDate: 'desc' },
            take: 12, // Last 12 cycles for pattern analysis
          },
        },
      })

      if (!creditCard) {
        console.warn(`Credit card not found for account ${account.account_id}`)
        errors++
        continue
      }

      // Update current balances
      await prisma.creditCard.update({
        where: { id: creditCard.id },
        data: {
          currentBalance: account.balances.current || 0,
          availableCredit: account.balances.available || undefined,
          creditLimit: account.balances.limit || undefined,
          aprPercentage: liability.aprs?.[0]?.apr_percentage || undefined,
        },
      })
      recordsUpdated++

      // Check if we have a new billing cycle (new statement date)
      const lastStatementDate = liability.last_statement_issue_date
        ? new Date(liability.last_statement_issue_date)
        : null
      const nextDueDate = liability.next_payment_due_date
        ? new Date(liability.next_payment_due_date)
        : null

      if (lastStatementDate) {
        // Check if this statement date already exists
        const existingCycle = await prisma.billingCycle.findFirst({
          where: {
            creditCardId: creditCard.id,
            cycleEndDate: lastStatementDate,
          },
        })

        if (!existingCycle && nextDueDate) {
          // Create new billing cycle
          await prisma.billingCycle.create({
            data: {
              creditCardId: creditCard.id,
              userId,
              cycleStartDate: new Date(0), // Will be calculated from previous cycle
              cycleEndDate: lastStatementDate,
              paymentDueDate: nextDueDate,
              statementBalance: liability.last_statement_balance || undefined,
              minimumPaymentDue: liability.minimum_payment_amount || undefined,
              isPaid: liability.last_payment_date !== null,
              isOverdue: liability.is_overdue || false,
              actualPaymentDate: liability.last_payment_date
                ? new Date(liability.last_payment_date)
                : undefined,
              actualPaymentAmount: liability.last_payment_amount || undefined,
              dataSource: 'plaid',
              confidence: 0.95,
              isProjected: false,
            },
          })
          billingCyclesCreated++
        }
      }

      // Analyze billing cycle pattern
      const historicalCycles = creditCard.billingCycles.map(cycle => ({
        statementDate: cycle.cycleEndDate,
        dueDate: cycle.paymentDueDate,
        statementBalance: cycle.statementBalance?.toNumber(),
      }))

      if (historicalCycles.length >= 2) {
        const analysis = analyzeBillingCyclePattern(historicalCycles)

        // Update credit card pattern
        await prisma.creditCard.update({
          where: { id: creditCard.id },
          data: {
            typicalCycleLength: analysis.pattern.typicalCycleLength,
            statementDayOfMonth: analysis.pattern.statementDayOfMonth,
            dueDateOffset: analysis.pattern.dueDateOffset,
            patternConfidence: analysis.pattern.confidence,
            lastPatternAnalysis: new Date(),
          },
        })

        // Project future cycles (6 months ahead)
        if (historicalCycles.length > 0) {
          const projections = projectFutureCycles(
            historicalCycles[0],
            analysis.pattern,
            6
          )

          // Create projected billing cycles
          for (const projection of projections) {
            // Check if projection already exists
            const exists = await prisma.billingCycle.findFirst({
              where: {
                creditCardId: creditCard.id,
                cycleEndDate: projection.cycleEndDate,
              },
            })

            if (!exists) {
              await prisma.billingCycle.create({
                data: {
                  creditCardId: creditCard.id,
                  userId,
                  cycleStartDate: projection.cycleStartDate,
                  cycleEndDate: projection.cycleEndDate,
                  paymentDueDate: projection.paymentDueDate,
                  isProjected: true,
                  confidence: projection.confidence,
                  dataSource: 'inferred',
                },
              })
            }
          }
        }
      }
    }

    // Update Plaid item sync status
    await prisma.plaidItem.update({
      where: { id: plaidItem.id },
      data: {
        lastSuccessfulSync: new Date(),
        lastSyncAttempt: new Date(),
        status: 'active',
      },
    })

    // Log sync
    await prisma.syncLog.create({
      data: {
        plaidItemId: plaidItem.id,
        userId,
        syncType: 'liabilities',
        status: errors > 0 ? 'partial' : 'success',
        recordsProcessed: accounts.length,
        recordsUpdated,
        recordsCreated: billingCyclesCreated,
        errorCount: errors,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        accountsProcessed: accounts.length,
        cardsUpdated: recordsUpdated,
        cyclesCreated: billingCyclesCreated,
        errors,
      },
    })
  } catch (error: any) {
    console.error('Error syncing liabilities:', error)

    // Log failed sync
    try {
      await prisma.syncLog.create({
        data: {
          userId: (session as any)?.user?.id,
          syncType: 'liabilities',
          status: 'error',
          errorMessage: error.message,
          completedAt: new Date(),
        },
      })
    } catch (logError) {
      console.error('Error logging failed sync:', logError)
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LIABILITIES_SYNC_ERROR',
          message: error.message || 'Failed to sync liabilities',
          details: error.response?.data,
        },
      },
      { status: 500 }
    )
  }
}
