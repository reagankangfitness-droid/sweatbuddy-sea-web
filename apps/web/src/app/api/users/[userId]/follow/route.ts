import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Create follow (upsert to avoid duplicate errors)
    const result = await prisma.userFollower.upsert({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId,
        },
      },
      create: {
        followerId: userId,
        followingId: targetUserId,
      },
      update: {},
    })

    // Notify the followed user (fire-and-forget)
    if (result.createdAt.getTime() > Date.now() - 5000) {
      // Only notify on fresh creates (upsert might hit an existing row)
      const follower = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, firstName: true, slug: true },
      })
      const followerName = follower?.firstName || follower?.name?.split(' ')[0] || 'Someone'
      void createNotification({
        userId: targetUserId,
        type: 'NEW_FOLLOWER',
        content: `${followerName} started following you`,
        title: 'New follower',
        link: follower?.slug ? `/user/${follower.slug}` : undefined,
        metadata: { followerId: userId },
      })
    }

    return NextResponse.json({ following: true })
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete the follow record if it exists
    await prisma.userFollower.deleteMany({
      where: {
        followerId: userId,
        followingId: targetUserId,
      },
    })

    return NextResponse.json({ following: false })
  } catch (error) {
    console.error('Unfollow error:', error)
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
