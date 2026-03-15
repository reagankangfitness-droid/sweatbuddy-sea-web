import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processWaitlistForSpot } from '@/lib/waitlist'

/**
 * POST /api/activities/[id]/cancel-rsvp
 * Attendee cancels their RSVP (e.g. from a reconfirmation prompt).
 * Releases the spot and auto-promotes the first waitlist entry if available.
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

    // Find the user's JOINED booking for this activity
    const userActivity = await prisma.userActivity.findFirst({
      where: {
        userId,
        activityId,
        status: 'JOINED',
      },
    })

    if (!userActivity) {
      return NextResponse.json(
        { error: 'No active booking found for this activity' },
        { status: 404 }
      )
    }

    // Build the update data: cancel the RSVP
    const updateData: Record<string, unknown> = {
      status: 'CANCELLED' as const,
    }

    // If deposit was held, mark it as refunded (voluntary cancellation before event)
    if (userActivity.depositStatus === 'HELD') {
      updateData.depositStatus = 'REFUNDED'
      updateData.depositRefundedAt = new Date()
    }

    await prisma.userActivity.update({
      where: { id: userActivity.id },
      data: updateData,
    })

    // Auto-promote first waitlist entry if a spot is now available
    await processWaitlistForSpot(activityId, 1)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error cancelling RSVP:', error)
    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    )
  }
}
