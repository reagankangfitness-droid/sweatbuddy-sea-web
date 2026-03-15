import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Host marks unchecked attendees as no-shows (called after session ends)
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
      return NextResponse.json({ error: 'Only the host can process no-shows' }, { status: 403 })
    }

    // Find all UserActivity records where status=JOINED and checkedIn=false
    const noShowRecords = await prisma.userActivity.findMany({
      where: {
        activityId,
        status: 'JOINED',
        checkedIn: false,
      },
      select: { userId: true, id: true },
    })

    if (noShowRecords.length === 0) {
      return NextResponse.json({ success: true, noShowCount: 0 })
    }

    const noShowUserIds = noShowRecords.map((r) => r.userId)

    // Use a transaction to forfeit deposits and increment noShowCount
    await prisma.$transaction(async (tx) => {
      // Set depositStatus=FORFEITED for all no-show UserActivity records
      await tx.userActivity.updateMany({
        where: {
          activityId,
          userId: { in: noShowUserIds },
          status: 'JOINED',
          checkedIn: false,
        },
        data: {
          depositStatus: 'FORFEITED',
        },
      })

      // Increment noShowCount for each no-show user
      for (const uid of noShowUserIds) {
        await tx.user.update({
          where: { id: uid },
          data: { noShowCount: { increment: 1 } },
        })
      }
    })

    return NextResponse.json({
      success: true,
      noShowCount: noShowRecords.length,
      noShowUserIds,
    })
  } catch (error) {
    console.error('[activities/process-no-shows] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
