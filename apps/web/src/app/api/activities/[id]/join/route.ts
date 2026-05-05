import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { onBookingConfirmed, onBookingCancelled } from '@/lib/stats/realtime'
import { processWaitlistForSpot, convertWaitlistToBooking } from '@/lib/waitlist'
import { scheduleRemindersForBooking, cancelRemindersForBooking } from '@/lib/reminders'
import { createNotification } from '@/lib/notifications'
import { getCurrentDbUser } from '@/lib/current-user'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = id

    // Check if activity exists (initial check before transaction)
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user is already joined
    const existingRsvp = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId: dbUser.id,
          activityId,
        },
      },
    })

    if (existingRsvp) {
      return NextResponse.json(
        { error: 'Already joined this activity' },
        { status: 400 }
      )
    }

    // Atomically check capacity and create participant inside transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-fetch activity with participants inside transaction for atomicity
      const freshActivity = await tx.activity.findUnique({
        where: { id: activityId, deletedAt: null },
      })

      if (!freshActivity) {
        throw new Error('ACTIVITY_NOT_FOUND')
      }

      if (freshActivity.maxPeople) {
        const currentParticipants = await tx.userActivity.count({
          where: {
            activityId,
            deletedAt: null,
            status: 'JOINED',
          },
        })
        if (currentParticipants >= freshActivity.maxPeople) {
          throw new Error('ACTIVITY_FULL')
        }
      }

      const userActivity = await tx.userActivity.create({
        data: {
          userId: dbUser.id,
          activityId,
          status: 'JOINED',
        },
      })

      // Find the activity's group chat
      const group = await tx.group.findFirst({
        where: {
          activityId,
          deletedAt: null,
        },
      })

      // Add user to group chat if it exists
      if (group) {
        await tx.userGroup.create({
          data: {
            userId: dbUser.id,
            groupId: group.id,
            role: 'MEMBER',
          },
        })
      }

      return userActivity
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    if (!result) {
      return NextResponse.json({ error: 'Failed to join activity' }, { status: 500 })
    }

    // Update real-time stats (async, don't block)
    try {
      await onBookingConfirmed(result, activity)
    } catch (statsError) {
      console.error('Error updating stats (non-blocking):', statsError)
    }

    // Convert waitlist entry if user was on waitlist (async, don't block)
    try {
      await convertWaitlistToBooking(
        activityId,
        dbUser.id,
        dbUser.email,
        result.id
      )
    } catch (waitlistError) {
      // Don't fail if waitlist conversion fails
      console.error('Error converting waitlist (non-blocking):', waitlistError)
    }

    // Schedule reminders for this booking (async, don't block)
    try {
      const reminderResult = await scheduleRemindersForBooking(result.id)
      // Reminders scheduled successfully
    } catch (reminderError) {
      // Don't fail if reminder scheduling fails
      console.error('Error scheduling reminders (non-blocking):', reminderError)
    }

    // Notify friends already RSVP'd to this activity (fire-and-forget)
    try {
      // Get user's followers who are also RSVP'd to this activity
      const friendsAtEvent = await prisma.userActivity.findMany({
        where: {
          activityId,
          status: 'JOINED',
          userId: { not: dbUser.id },
          user: {
            // Users who follow the joining user (they're "friends")
            following: { some: { followingId: dbUser.id } },
          },
        },
        select: { userId: true },
      })

      if (friendsAtEvent.length > 0) {
        const joinerName = dbUser.name?.split(' ')[0] || 'A friend'
        for (const friend of friendsAtEvent) {
          void createNotification({
            userId: friend.userId,
            type: 'FRIEND_RSVP',
            title: `${joinerName} is going too!`,
            content: `${joinerName} just RSVP'd to "${activity.title}"`,
            link: `/activities/${activityId}`,
            metadata: { activityId, friendUserId: dbUser.id },
          })
        }
      }
    } catch (friendNotifyError) {
      console.error('Error notifying friends (non-blocking):', friendNotifyError)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (message === 'ACTIVITY_FULL') {
      return NextResponse.json(
        { error: 'Activity is full' },
        { status: 400 }
      )
    }
    if (message === 'ACTIVITY_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      )
    }
    console.error('Error joining activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = id

    // Find the activity first (for stats update)
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    // Find and delete the UserActivity record
    const existingRsvp = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId: dbUser.id,
          activityId,
        },
      },
    })

    if (!existingRsvp) {
      return NextResponse.json(
        { error: 'Not joined to this activity' },
        { status: 400 }
      )
    }

    // Delete UserActivity and remove from group chat
    await prisma.$transaction(async (tx) => {
      await tx.userActivity.delete({
        where: {
          userId_activityId: {
                userId: dbUser.id,
                activityId,
          },
        },
      })

      // Find the activity's group chat
      const group = await tx.group.findFirst({
        where: {
          activityId,
          deletedAt: null,
        },
      })

      // Remove user from group chat if they're a member
      if (group) {
        await tx.userGroup.deleteMany({
          where: {
            userId: dbUser.id,
            groupId: group.id,
          },
        })
      }
    })

    // Update real-time stats (async, don't block)
    try {
      if (activity) {
        await onBookingCancelled(existingRsvp, activity)
      }
    } catch (statsError) {
      console.error('Error updating stats (non-blocking):', statsError)
    }

    // Process waitlist - notify next person that a spot opened up
    try {
      const waitlistResult = await processWaitlistForSpot(activityId, 1)
      // Waitlist processed successfully
    } catch (waitlistError) {
      console.error('Error processing waitlist (non-blocking):', waitlistError)
    }

    // Cancel scheduled reminders for this booking (async, don't block)
    try {
      const cancelledCount = await cancelRemindersForBooking(existingRsvp.id)
      // Reminders cancelled successfully
    } catch (reminderError) {
      console.error('Error cancelling reminders (non-blocking):', reminderError)
    }

    return NextResponse.json({ message: 'Successfully left activity' })
  } catch (error) {
    console.error('Error leaving activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
