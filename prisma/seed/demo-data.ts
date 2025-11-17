/**
 * Seed Script - Demo Data
 * Creates demo user with sample credit cards and billing cycles
 */

import { PrismaClient } from '@prisma/client'
import { addMonths, subMonths, addDays, startOfMonth, setDate } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with demo data...')

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@malabar.finance' },
    update: {},
    create: {
      email: 'demo@malabar.finance',
      name: 'Demo User',
      industry: 'freelancer',
      profession: 'Software Developer',
    },
  })

  console.log('✅ Created demo user:', user.email)

  // Create credit cards
  const chase = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: 'Chase Sapphire Preferred',
      issuer: 'Chase',
      lastFourDigits: '4567',
      network: 'Visa',
      currentBalance: 2847.50,
      availableCredit: 7152.50,
      creditLimit: 10000,
      typicalCycleLength: 30,
      statementDayOfMonth: 15,
      dueDateOffset: 21,
      patternConfidence: 0.92,
      aprPercentage: 18.99,
      annualFee: 95,
      isActive: true,
    },
  })

  const amex = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: 'American Express Gold',
      issuer: 'American Express',
      lastFourDigits: '1234',
      network: 'Amex',
      currentBalance: 1523.75,
      availableCredit: null,
      creditLimit: null,
      typicalCycleLength: 30,
      statementDayOfMonth: 5,
      dueDateOffset: 25,
      patternConfidence: 0.88,
      aprPercentage: 19.99,
      annualFee: 250,
      isActive: true,
    },
  })

  const discover = await prisma.creditCard.create({
    data: {
      userId: user.id,
      name: 'Discover it Cash Back',
      issuer: 'Discover',
      lastFourDigits: '8901',
      network: 'Discover',
      currentBalance: 645.25,
      availableCredit: 4354.75,
      creditLimit: 5000,
      typicalCycleLength: 31,
      statementDayOfMonth: 28,
      dueDateOffset: 23,
      patternConfidence: 0.95,
      aprPercentage: 15.99,
      annualFee: 0,
      isActive: true,
    },
  })

  console.log('✅ Created 3 credit cards')

  // Helper function to create billing cycles
  async function createCycles(
    creditCard: any,
    statementDay: number,
    dueOffset: number,
    monthsToCreate: number
  ) {
    const cycles = []

    // Create past cycles (3 months back)
    for (let i = -3; i < monthsToCreate; i++) {
      const baseDate = addMonths(new Date(), i)
      const statementDate = setDate(startOfMonth(baseDate), Math.min(statementDay, 28))
      const dueDate = addDays(statementDate, dueOffset)
      const cycleStart = addDays(subMonths(statementDate, 1), 1)

      const isHistorical = i < 0
      const isFuture = i >= 1

      cycles.push({
        creditCardId: creditCard.id,
        userId: user.id,
        cycleStartDate: cycleStart,
        cycleEndDate: statementDate,
        paymentDueDate: dueDate,
        statementBalance: isHistorical ? Math.random() * 3000 + 500 : isFuture ? null : creditCard.currentBalance,
        minimumPaymentDue: isHistorical ? Math.random() * 100 + 25 : isFuture ? null : creditCard.currentBalance * 0.02,
        isPaid: isHistorical,
        isOverdue: false,
        isProjected: isFuture,
        confidence: isFuture ? 0.85 - (i * 0.05) : 0.92,
        dataSource: isFuture ? 'inferred' : isHistorical ? 'plaid' : 'plaid',
      })
    }

    return cycles
  }

  // Create billing cycles for Chase (15th of month, due 21 days later)
  const chaseCycles = await createCycles(chase, 15, 21, 7)
  await prisma.billingCycle.createMany({ data: chaseCycles })
  console.log(`✅ Created ${chaseCycles.length} billing cycles for Chase Sapphire`)

  // Create billing cycles for Amex (5th of month, due 25 days later)
  const amexCycles = await createCycles(amex, 5, 25, 7)
  await prisma.billingCycle.createMany({ data: amexCycles })
  console.log(`✅ Created ${amexCycles.length} billing cycles for Amex Gold`)

  // Create billing cycles for Discover (28th of month, due 23 days later)
  const discoverCycles = await createCycles(discover, 28, 23, 7)
  await prisma.billingCycle.createMany({ data: discoverCycles })
  console.log(`✅ Created ${discoverCycles.length} billing cycles for Discover it`)

  // Create some rewards cards
  await prisma.rewardsCard.createMany({
    data: [
      {
        userId: user.id,
        creditCardId: chase.id,
        cardName: 'Chase Sapphire Preferred',
        issuer: 'Chase',
        network: 'Visa',
        baseRewardRate: 1.0,
        rewardsCurrency: 'points',
        categoryBonuses: [
          { category: 'travel', rate: 2.0, cap: null },
          { category: 'dining', rate: 3.0, cap: null },
        ],
        hasRotatingCategories: false,
        annualFee: 95,
        signUpBonus: 60000,
        signUpBonusRequirement: 4000,
        signUpBonusDeadline: addMonths(new Date(), 3),
        signUpBonusProgress: 2350,
        isActive: true,
      },
      {
        userId: user.id,
        creditCardId: amex.id,
        cardName: 'American Express Gold Card',
        issuer: 'American Express',
        network: 'Amex',
        baseRewardRate: 1.0,
        rewardsCurrency: 'points',
        categoryBonuses: [
          { category: 'dining', rate: 4.0, cap: null },
          { category: 'groceries', rate: 4.0, cap: 25000 },
        ],
        hasRotatingCategories: false,
        annualFee: 250,
        isActive: true,
      },
      {
        userId: user.id,
        creditCardId: discover.id,
        cardName: 'Discover it Cash Back',
        issuer: 'Discover',
        network: 'Discover',
        baseRewardRate: 1.0,
        rewardsCurrency: 'cashback',
        categoryBonuses: [],
        hasRotatingCategories: true,
        rotatingCategories: [
          {
            quarter: 'Q1-2025',
            categories: ['grocery_stores', 'drugstores'],
            rate: 5.0,
            cap: 1500,
          },
        ],
        requiresActivation: true,
        annualFee: 0,
        isActive: true,
      },
    ],
  })

  console.log('✅ Created rewards card configurations')

  // Create sync log
  await prisma.syncLog.create({
    data: {
      userId: user.id,
      syncType: 'seed',
      status: 'success',
      recordsProcessed: 3,
      recordsCreated: 3,
      errorCount: 0,
      completedAt: new Date(),
      metadata: {
        message: 'Demo data seeded successfully',
      },
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
