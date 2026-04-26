import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId } = await params

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch the activity
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: {
        id: true,
        title: true,
        startTime: true,
        endTime: true,
        address: true,
        city: true,
        imageUrl: true,
        categorySlug: true,
        userId: true,
        hostId: true,
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify session has ended
    if (!activity.startTime || new Date(activity.startTime) > new Date()) {
      return NextResponse.json({ error: 'Session has not ended yet' }, { status: 400 })
    }

    // Verify user attended
    const userAttendance = await prisma.userActivity.findFirst({
      where: {
        userId: dbUser.id,
        activityId,
        status: { in: ['JOINED', 'COMPLETED'] },
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!userAttendance) {
      return NextResponse.json({ error: 'You did not attend this session' }, { status: 403 })
    }

    // Fetch all attendees
    const attendees = await prisma.userActivity.findMany({
      where: {
        activityId,
        status: { in: ['JOINED', 'COMPLETED'] },
        deletedAt: null,
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true,
          },
        },
      },
    })

    // Fetch host info
    const hostUser = await prisma.user.findUnique({
      where: { id: activity.hostId ?? activity.userId },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        slug: true,
      },
    })

    // Check if user has left a review for this session
    const existingReview = await prisma.review.findFirst({
      where: {
        activityId,
        reviewerId: dbUser.id,
      },
      select: { id: true },
    })

    // Fetch completion card images for this session
    const completionCards = await prisma.completionCard.findMany({
      where: { activityId },
      select: {
        id: true,
        photoUrl: true,
        userId: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const attendeeList = attendees
      .map((a) => a.user)
      .filter((u) => u.id !== dbUser.id) // exclude current user from list

    return NextResponse.json({
      session: {
        id: activity.id,
        title: activity.title,
        startTime: activity.startTime,
        endTime: activity.endTime,
        address: activity.address,
        city: activity.city,
        imageUrl: activity.imageUrl,
        categorySlug: activity.categorySlug,
      },
      host: hostUser,
      attendees: attendeeList,
      attendeeCount: attendees.length,
      hasReviewed: !!existingReview,
      sessionImages: completionCards.map((c) => ({
        id: c.id,
        photoUrl: c.photoUrl,
        userId: c.userId,
      })),
    })
  } catch (error) {
    console.error('[RECAP_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
