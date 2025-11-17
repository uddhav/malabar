/**
 * Plaid Webhook Handler
 *
 * Handles webhook events from Plaid:
 * - DEFAULT_UPDATE: New data available (liabilities, transactions)
 * - SYNC_UPDATES_AVAILABLE: New transactions ready to sync
 * - ITEM_LOGIN_REQUIRED: User needs to re-authenticate
 * - ERROR: Item error occurred
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { plaidClient } from '@/lib/plaid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_type, webhook_code, item_id, error } = body

    console.log('Received Plaid webhook:', { webhook_type, webhook_code, item_id })

    // Log webhook
    await prisma.webhookLog.create({
      data: {
        webhookType: `${webhook_type}:${webhook_code}`,
        plaidItemId: item_id,
        payload: body,
        processed: false,
      },
    })

    // Find Plaid item
    const plaidItem = await prisma.plaidItem.findUnique({
      where: { plaidItemId: item_id },
    })

    if (!plaidItem) {
      console.warn(`Plaid item not found: ${item_id}`)
      return NextResponse.json({ received: true })
    }

    // Handle different webhook types
    switch (webhook_type) {
      case 'LIABILITIES':
        await handleLiabilitiesWebhook(plaidItem, webhook_code)
        break

      case 'TRANSACTIONS':
        await handleTransactionsWebhook(plaidItem, webhook_code)
        break

      case 'ITEM':
        await handleItemWebhook(plaidItem, webhook_code, error)
        break

      default:
        console.log(`Unhandled webhook type: ${webhook_type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing Plaid webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleLiabilitiesWebhook(plaidItem: any, webhookCode: string) {
  console.log(`Processing liabilities webhook: ${webhookCode}`)

  if (webhookCode === 'DEFAULT_UPDATE') {
    // New liabilities data available - trigger sync
    // In production, you'd queue this job to a background worker
    console.log(`Triggering liabilities sync for item ${plaidItem.id}`)

    // Mark for sync (a background job would pick this up)
    await prisma.plaidItem.update({
      where: { id: plaidItem.id },
      data: {
        lastSyncAttempt: new Date(),
      },
    })
  }
}

async function handleTransactionsWebhook(plaidItem: any, webhookCode: string) {
  console.log(`Processing transactions webhook: ${webhookCode}`)

  if (webhookCode === 'SYNC_UPDATES_AVAILABLE') {
    // New transactions available - trigger sync
    console.log(`Triggering transactions sync for item ${plaidItem.id}`)

    await prisma.plaidItem.update({
      where: { id: plaidItem.id },
      data: {
        lastSyncAttempt: new Date(),
      },
    })
  }
}

async function handleItemWebhook(
  plaidItem: any,
  webhookCode: string,
  error?: any
) {
  console.log(`Processing item webhook: ${webhookCode}`)

  switch (webhookCode) {
    case 'ERROR':
      // Item error occurred
      await prisma.plaidItem.update({
        where: { id: plaidItem.id },
        data: {
          status: 'error',
        },
      })
      console.error(`Item error for ${plaidItem.id}:`, error)
      break

    case 'PENDING_EXPIRATION':
      // Access token will expire soon
      await prisma.plaidItem.update({
        where: { id: plaidItem.id },
        data: {
          status: 'requires_update',
        },
      })
      break

    case 'USER_PERMISSION_REVOKED':
      // User revoked access
      await prisma.plaidItem.update({
        where: { id: plaidItem.id },
        data: {
          status: 'revoked',
        },
      })
      break

    case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
      // Webhook URL update acknowledged
      console.log('Webhook URL update acknowledged')
      break

    default:
      console.log(`Unhandled item webhook code: ${webhookCode}`)
  }
}
