import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

// POST - Host marks an attendee as checked in
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId } = await params

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const callerUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!callerUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userId: targetUserId } = body

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    // Verify the activity exists and the caller is the host
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { id: true, hostId: true, userId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const hostId = activity.hostId ?? activity.userId
    if (hostId !== callerUser.id) {
      return NextResponse.json({ error: 'Only the host can check in attendees' }, { status: 403 })
    }

    // Find the UserActivity record for the target user
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: { userId: targetUserId, activityId },
      },
    })

    if (!userActivity) {
      return NextResponse.json({ error: 'User is not part of this activity' }, { status: 404 })
    }

    if (userActivity.checkedIn) {
      return NextResponse.json({ error: 'User is already checked in' }, { status: 400 })
    }

    // Build the update data
    const now = new Date()
    const updateData: Record<string, unknown> = {
      checkedIn: true,
      checkedInAt: now,
    }

    // If deposit was HELD, refund it on check-in
    if (userActivity.depositStatus === 'HELD') {
      updateData.depositStatus = 'REFUNDED'
      updateData.depositRefundedAt = now
    }

    const updated = await prisma.userActivity.update({
      where: {
        userId_activityId: { userId: targetUserId, activityId },
      },
      data: updateData,
    })

    // Increment the attendee's session count
    await prisma.user.update({
      where: { id: targetUserId },
      data: { sessionsAttendedCount: { increment: 1 } },
    })

    // Check and award any badges the attendee has now earned
    const newBadges = await checkAndAwardBadges(targetUserId)

    return NextResponse.json({
      success: true,
      newBadges,
      userActivity: {
        id: updated.id,
        userId: updated.userId,
        checkedIn: updated.checkedIn,
        checkedInAt: updated.checkedInAt,
        depositStatus: updated.depositStatus,
        depositRefundedAt: updated.depositRefundedAt,
      },
    })
  } catch (error) {
    console.error('[activities/checkin] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
