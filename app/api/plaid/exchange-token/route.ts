/**
 * Exchange Plaid Public Token for Access Token
 *
 * After user completes Plaid Link flow, exchange the public_token
 * for a permanent access_token to make API requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { plaidClient } from '@/lib/plaid'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'

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
    const { publicToken, metadata } = body

    if (!publicToken) {
      return NextResponse.json(
        { error: 'Missing public_token' },
        { status: 400 }
      )
    }

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get institution details
    const itemResponse = await plaidClient.itemGet({
      access_token: accessToken,
    })

    const institutionId = itemResponse.data.item.institution_id!

    // Get institution name
    let institutionName = 'Unknown Institution'
    try {
      const institutionResponse = await plaidClient.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'] as any,
      })
      institutionName = institutionResponse.data.institution.name
    } catch (error) {
      console.error('Error fetching institution name:', error)
    }

    // Store Plaid item in database
    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId,
        plaidAccessToken: accessToken,
        plaidItemId: itemId,
        institutionId,
        institutionName,
        status: 'active',
        lastSuccessfulSync: new Date(),
      },
    })

    // Fetch accounts and create credit card records
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    })

    const creditCardAccounts = accountsResponse.data.accounts.filter(
      account => account.type === 'credit'
    )

    // Create credit card records
    const createdCards = []
    for (const account of creditCardAccounts) {
      const card = await prisma.creditCard.create({
        data: {
          userId,
          plaidItemId: plaidItem.id,
          plaidAccountId: account.account_id,
          name: account.official_name || account.name,
          lastFourDigits: account.mask || undefined,
          issuer: institutionName,
          currentBalance: account.balances.current || 0,
          availableCredit: account.balances.available || undefined,
          creditLimit: account.balances.limit || undefined,
          isActive: true,
        },
      })
      createdCards.push(card)
    }

    // Log successful sync
    await prisma.syncLog.create({
      data: {
        plaidItemId: plaidItem.id,
        userId,
        syncType: 'initial',
        status: 'success',
        recordsProcessed: creditCardAccounts.length,
        recordsCreated: createdCards.length,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        itemId: plaidItem.id,
        institutionName,
        accountsLinked: createdCards.length,
        creditCards: createdCards.map(card => ({
          id: card.id,
          name: card.name,
          lastFourDigits: card.lastFourDigits,
        })),
      },
    })
  } catch (error: any) {
    console.error('Error exchanging public token:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TOKEN_EXCHANGE_ERROR',
          message: error.message || 'Failed to exchange token',
          details: error.response?.data,
        },
      },
      { status: 500 }
    )
  }
}
