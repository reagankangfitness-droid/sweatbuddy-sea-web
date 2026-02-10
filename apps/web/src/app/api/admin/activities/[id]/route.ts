import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminUser } from '@/lib/admin-auth'
import { notifyFollowersOfNewActivity } from '@/lib/follower-notifications'

// PATCH - Approve or reject an activity
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser(userId)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action } = body // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Find the activity
    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Update the activity status
    const newStatus = action === 'approve' ? 'PUBLISHED' : 'CANCELLED'

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: {
        status: newStatus,
      },
    })

    // Create a notification for the user
    await prisma.notification.create({
      data: {
        userId: activity.userId,
        type: 'ACTIVITY_UPDATE',
        title: action === 'approve'
          ? 'Your event has been approved!'
          : 'Your event was not approved',
        content: action === 'approve'
          ? `Great news! Your event "${activity.title}" has been approved and is now live on SweatBuddies.`
          : `Unfortunately, your event "${activity.title}" was not approved. Please review our guidelines and try again.`,
        link: action === 'approve' ? `/activities/${activity.id}` : '/activities/create',
      },
    })

    // Notify followers when activity is approved
    if (action === 'approve') {
      notifyFollowersOfNewActivity(
        activity.hostId || activity.userId,
        {
          id: activity.id,
          title: activity.title,
          startTime: activity.startTime,
          city: activity.city,
          categorySlug: activity.categorySlug,
        }
      ).catch((err) => console.error('Failed to notify followers:', err))
    }

    return NextResponse.json({
      success: true,
      activity: updatedActivity,
      message: action === 'approve'
        ? 'Activity approved successfully'
        : 'Activity rejected',
    })
  } catch (error) {
    console.error('Error updating activity status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET - Get single activity details for admin review
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdminUser(userId)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params

    const activity = await prisma.activity.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
            createdAt: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
