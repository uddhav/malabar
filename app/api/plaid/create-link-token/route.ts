/**
 * Create Plaid Link Token
 *
 * Generates a link_token for Plaid Link initialization
 * Link tokens expire after 4 hours
 */

import { NextRequest, NextResponse } from 'next/server'
import { plaidClient, plaidConfig } from '@/lib/plaid'
import { getServerSession } from 'next-auth'
import { Products, CountryCode } from 'plaid'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user session
    const session = await getServerSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Create link token request
    const linkTokenRequest = {
      user: {
        client_user_id: userId,
      },
      client_name: 'Malabar Finance',
      products: plaidConfig.products as Products[],
      country_codes: plaidConfig.countryCodes as CountryCode[],
      language: 'en',
      webhook: plaidConfig.webhookUrl,
      redirect_uri: plaidConfig.redirectUri,
    }

    const response = await plaidClient.linkTokenCreate(linkTokenRequest)
    const linkToken = response.data.link_token

    return NextResponse.json({
      success: true,
      data: {
        linkToken,
        expiration: response.data.expiration,
      },
    })
  } catch (error: any) {
    console.error('Error creating link token:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_TOKEN_CREATE_ERROR',
          message: error.message || 'Failed to create link token',
          details: error.response?.data,
        },
      },
      { status: 500 }
    )
  }
}
