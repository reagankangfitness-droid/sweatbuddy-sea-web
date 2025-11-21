import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    // Create UserActivity record
    const userActivity = await prisma.userActivity.create({
      data: {
        userId,
        activityId,
        status: 'JOINED',
      },
    })

    return NextResponse.json(userActivity, { status: 201 })
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

    await prisma.userActivity.delete({
      where: {
        userId_activityId: {
          userId,
          activityId,
        },
      },
    })

    return NextResponse.json({ message: 'Successfully left activity' })
  } catch (error) {
    console.error('Error leaving activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
