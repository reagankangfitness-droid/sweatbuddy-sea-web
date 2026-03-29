import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/buddy/sessions/pending-feedback
 * Returns sessions the user attended that have ended and haven't been rated yet.
 * Only checks sessions from the last 48 hours.
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ sessions: [] })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ sessions: [] })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ sessions: [] })
    }

    const now = new Date()
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000)

    // Find sessions the user joined that have ended (startTime < now) and started within last 48h
    const attended = await prisma.userActivity.findMany({
      where: {
        userId: dbUser.id,
        status: { in: ['JOINED', 'COMPLETED'] },
        activity: {
          startTime: { gt: twoDaysAgo, lt: now },
          deletedAt: null,
          status: 'PUBLISHED',
        },
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            startTime: true,
            userId: true,
            user: { select: { id: true, name: true } },
          },
        },
      },
      take: 5,
    })

    if (attended.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // Filter out sessions already reviewed
    const activityIds = attended.map((a) => a.activityId)
    const existingReviews = await prisma.userReview.findMany({
      where: {
        reviewerId: dbUser.id,
        activityId: { in: activityIds },
      },
      select: { activityId: true },
    })
    const reviewedIds = new Set(existingReviews.map((r) => r.activityId))

    const pending = attended
      .filter((a) => !reviewedIds.has(a.activityId))
      .filter((a) => a.activity.userId !== dbUser.id) // Don't ask hosts to rate themselves
      .map((a) => ({
        id: a.activity.id,
        title: a.activity.title,
        hostId: a.activity.userId,
        hostName: a.activity.user.name,
      }))

    return NextResponse.json({ sessions: pending })
  } catch (error) {
    console.error('[pending-feedback] Error:', error)
    return NextResponse.json({ sessions: [] })
  }
}
