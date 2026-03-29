import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

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

    const { activityId, hostId, rating, positive } = await request.json()

    if (!activityId || !hostId) {
      return NextResponse.json({ error: 'Activity ID and host ID required' }, { status: 400 })
    }

    // Verify user actually attended this session
    const userActivity = await prisma.userActivity.findUnique({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
    })
    if (!userActivity || !['JOINED', 'COMPLETED'].includes(userActivity.status)) {
      return NextResponse.json({ error: 'You must attend a session to leave feedback' }, { status: 403 })
    }

    // Check for existing review
    const existing = await prisma.userReview.findUnique({
      where: { reviewerId_revieweeId_activityId: { reviewerId: dbUser.id, revieweeId: hostId, activityId } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Feedback already submitted' }, { status: 400 })
    }

    // Create the review
    await prisma.userReview.create({
      data: {
        reviewerId: dbUser.id,
        revieweeId: hostId,
        activityId,
        rating: rating ?? (positive ? 5 : 2),
        comment: positive ? 'thumbs_up' : 'thumbs_down',
      },
    })

    // Update host reliability based on feedback
    if (!positive) {
      // Negative feedback reduces reliability slightly
      await prisma.user.update({
        where: { id: hostId },
        data: {
          reliabilityScore: { decrement: 2 },
        },
      })
    } else {
      // Positive feedback adds a small boost (capped at 100)
      const host = await prisma.user.findUnique({ where: { id: hostId }, select: { reliabilityScore: true } })
      if (host && host.reliabilityScore < 100) {
        await prisma.user.update({
          where: { id: hostId },
          data: {
            reliabilityScore: Math.min(100, host.reliabilityScore + 1),
          },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/sessions/feedback] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
