import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/push/eligibility
 * Check if the current user is eligible to be prompted for push notifications.
 * Eligibility: user has RSVP'd (JOINED or COMPLETED) to at least 1 event.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ eligible: false })
    }

    const rsvpCount = await prisma.userActivity.count({
      where: {
        userId,
        status: { in: ['JOINED', 'COMPLETED'] },
        deletedAt: null,
      },
      take: 1,
    })

    return NextResponse.json({ eligible: rsvpCount > 0 })
  } catch (error) {
    console.error('Error checking push eligibility:', error)
    return NextResponse.json({ eligible: false })
  }
}
