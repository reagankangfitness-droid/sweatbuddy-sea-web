import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/activities/[id]/reconfirm
 * Attendee confirms they're still coming to the activity.
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

    // Set reconfirmedAt to now
    await prisma.userActivity.update({
      where: { id: userActivity.id },
      data: { reconfirmedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reconfirming RSVP:', error)
    return NextResponse.json(
      { error: 'Failed to reconfirm RSVP' },
      { status: 500 }
    )
  }
}
