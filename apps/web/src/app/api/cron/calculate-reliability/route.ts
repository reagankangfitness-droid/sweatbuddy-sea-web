import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isValidCronSecret } from '@/lib/cron-auth'
import { calculateReliabilityScore, evaluateHostTier } from '@/lib/reliability'
import { HostTier } from '@prisma/client'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes max for cron jobs

const BATCH_SIZE = 100

// GET - Called weekly by Vercel cron
// Recalculates reliability scores and host tiers for all users
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('x-cron-secret') || ''
  const authHeader = request.headers.get('authorization')
  const bearerSecret = authHeader?.replace('Bearer ', '') || ''
  const expectedSecret = process.env.CRON_SECRET || ''

  const isVercelCron = !!expectedSecret && isValidCronSecret(bearerSecret, expectedSecret)
  const isManualCron = !!expectedSecret && isValidCronSecret(cronSecret, expectedSecret)

  if (!isVercelCron && !isManualCron) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Step 1: Get all user IDs that have at least 1 UserActivity
    const usersWithActivity = await prisma.userActivity.findMany({
      select: { userId: true },
      distinct: ['userId'],
    })

    const userIds = usersWithActivity.map(u => u.userId)
    let usersUpdated = 0
    let tiersChanged = 0

    // Step 2: Process in batches of 100
    for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
      const batch = userIds.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (userId) => {
          // Recalculate reliability score
          const score = await calculateReliabilityScore(userId)

          await prisma.user.update({
            where: { id: userId },
            data: { reliabilityScore: score },
          })
          usersUpdated++

          // Check if user is a host and evaluate tier
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isHost: true, hostTier: true },
          })

          if (user?.isHost) {
            const newTier = await evaluateHostTier(userId)
            if (newTier !== user.hostTier) {
              await prisma.user.update({
                where: { id: userId },
                data: {
                  hostTier: newTier as HostTier,
                  hostTierUpdatedAt: new Date(),
                },
              })
              tiersChanged++
            }
          }
        })
      )
    }

    return NextResponse.json({
      success: true,
      usersUpdated,
      tiersChanged,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Reliability cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
