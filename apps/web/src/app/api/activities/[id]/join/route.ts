import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { onBookingConfirmed, onBookingCancelled } from '@/lib/stats/realtime'

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

    return NextResponse.json({ message: 'Successfully left activity' })
  } catch (error) {
    console.error('Error leaving activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
