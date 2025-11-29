import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { onBookingConfirmed, onBookingCancelled } from '@/lib/stats/realtime'
import { processWaitlistForSpot, convertWaitlistToBooking } from '@/lib/waitlist'
import { scheduleRemindersForBooking, cancelRemindersForBooking } from '@/lib/reminders'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

    // Get user details from Clerk and sync to database
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(userId)

    // Ensure user exists in database (upsert)
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
      update: {
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        name: clerkUser.fullName || clerkUser.firstName || null,
        imageUrl: clerkUser.imageUrl || null,
      },
    })

    // Check if activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      include: {
        userActivities: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check if user is already joined
    const existingRsvp = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
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

    // Check if activity is full
    if (activity.maxPeople) {
      const currentParticipants = activity.userActivities.filter(
        (ua) => ua.status === 'JOINED'
      ).length
      if (currentParticipants >= activity.maxPeople) {
        return NextResponse.json(
          { error: 'Activity is full' },
          { status: 400 }
        )
      }
    }

    // Create UserActivity record and add to group chat
    const result = await prisma.$transaction(async (tx) => {
      const userActivity = await tx.userActivity.create({
        data: {
          userId,
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
            userId,
            groupId: group.id,
            role: 'MEMBER',
          },
        })
      }

      return userActivity
    })

    // Update real-time stats (async, don't block)
    try {
      await onBookingConfirmed(result, activity)
    } catch (statsError) {
      console.error('Error updating stats (non-blocking):', statsError)
    }

    // Convert waitlist entry if user was on waitlist (async, don't block)
    try {
      const clerkUser = await (await clerkClient()).users.getUser(userId)
      await convertWaitlistToBooking(
        activityId,
        userId,
        clerkUser.emailAddresses[0]?.emailAddress,
        result.id
      )
    } catch (waitlistError) {
      // Don't fail if waitlist conversion fails
      console.error('Error converting waitlist (non-blocking):', waitlistError)
    }

    // Schedule reminders for this booking (async, don't block)
    try {
      const reminderResult = await scheduleRemindersForBooking(result.id)
      console.log(`Scheduled ${reminderResult.scheduled} reminders for booking ${result.id}`)
    } catch (reminderError) {
      // Don't fail if reminder scheduling fails
      console.error('Error scheduling reminders (non-blocking):', reminderError)
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error joining activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate with Clerk
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activityId = params.id

    // Find the activity first (for stats update)
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
    })

    // Find and delete the UserActivity record
    const existingRsvp = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId,
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
            userId,
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
            userId,
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
      console.log(`Waitlist processed: ${waitlistResult.notified} person(s) notified`)
    } catch (waitlistError) {
      console.error('Error processing waitlist (non-blocking):', waitlistError)
    }

    // Cancel scheduled reminders for this booking (async, don't block)
    try {
      const cancelledCount = await cancelRemindersForBooking(existingRsvp.id)
      console.log(`Cancelled ${cancelledCount} reminders for booking ${existingRsvp.id}`)
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
