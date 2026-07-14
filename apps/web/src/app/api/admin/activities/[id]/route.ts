import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminActorId, isAdminRequest, isAdminUser } from '@/lib/admin-auth'
import { logAdminAction } from '@/lib/admin-audit'
import { notifyFollowersOfNewActivity } from '@/lib/follower-notifications'
import { checkAndAwardBadges } from '@/lib/badges'

// PATCH - Approve or reject an activity
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminId = await getAdminActorId(request) ?? 'admin'

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

    const wasAlreadyPublished = activity.status === 'PUBLISHED'
    const updatedActivity = await prisma.$transaction(async (tx) => {
      const updated = await tx.activity.update({
        where: { id },
        data: action === 'approve'
          ? {
              status: 'PUBLISHED',
              requiresApproval: false,
              moderationStatus: 'LIVE',
              riskScore: 0,
              riskFlags: [],
              moderationNotes: null,
            }
          : {
              status: 'CANCELLED',
              requiresApproval: false,
              moderationStatus: 'REJECTED',
            },
      })

      if (action === 'approve' && !wasAlreadyPublished) {
        await tx.user.update({
          where: { id: activity.hostId || activity.userId },
          data: { sessionsHostedCount: { increment: 1 } },
        })
      }

      return updated
    })

    if (action === 'approve' && !wasAlreadyPublished) {
      await checkAndAwardBadges(activity.hostId || activity.userId).catch((error) => {
        console.error('Failed to award hosting badges:', error)
      })
    }

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
        link: action === 'approve' ? `/activities/${activity.id}` : '/hub',
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

    await logAdminAction({
      action: action === 'approve' ? 'approve_activity' : 'reject_activity',
      targetType: 'activity',
      targetId: activity.id,
      adminId,
      details: {
        title: activity.title,
        previousStatus: activity.status,
        nextStatus: updatedActivity.status,
        previousModerationStatus: activity.moderationStatus,
        nextModerationStatus: updatedActivity.moderationStatus,
      },
    })

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

// DELETE - Hard-delete a P2P session (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdminRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const adminId = await getAdminActorId(request) ?? 'admin'

    const { id } = await params

    const activity = await prisma.activity.findUnique({ where: { id } })
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Soft-delete: set deletedAt so data is preserved
    await prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAdminAction({
      action: 'delete_activity',
      targetType: 'activity',
      targetId: activity.id,
      adminId,
      details: {
        title: activity.title,
        status: activity.status,
        moderationStatus: activity.moderationStatus,
      },
    })

    return NextResponse.json({ success: true, message: 'Session deleted' })
  } catch (error) {
    console.error('Error deleting activity:', error)
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
