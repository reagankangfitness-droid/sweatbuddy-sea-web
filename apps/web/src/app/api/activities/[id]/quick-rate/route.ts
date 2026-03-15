import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// POST - Quick 1-5 star rating (simpler than full review)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()
    if (!clerkUserId) {
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

    const body = await request.json()
    const { rating } = body

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
    }

    // Verify the activity exists
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { id: true, hostId: true, userId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const hostId = activity.hostId ?? activity.userId

    // Verify user attended (has UserActivity with JOINED/COMPLETED)
    const userActivity = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: { userId: dbUser.id, activityId },
      },
      select: { id: true, status: true },
    })

    if (!userActivity || !['JOINED', 'COMPLETED'].includes(userActivity.status)) {
      return NextResponse.json(
        { error: 'You must have attended this activity to rate it' },
        { status: 403 }
      )
    }

    // Check if a review already exists for this userActivity
    const existingReview = await prisma.review.findUnique({
      where: { userActivityId: userActivity.id },
      select: { id: true, rating: true },
    })

    let review
    if (existingReview) {
      // Update the existing review's rating
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          editedAt: new Date(),
          editCount: { increment: 1 },
        },
        select: { id: true, rating: true, title: true, createdAt: true, updatedAt: true },
      })
    } else {
      // Create a new minimal review
      review = await prisma.review.create({
        data: {
          activityId,
          userActivityId: userActivity.id,
          reviewerId: dbUser.id,
          hostId,
          rating,
          title: 'Quick rating',
          status: 'PUBLISHED',
          isVerified: true,
        },
        select: { id: true, rating: true, title: true, createdAt: true, updatedAt: true },
      })
    }

    return NextResponse.json({
      success: true,
      review,
      updated: !!existingReview,
    })
  } catch (error) {
    console.error('[activities/quick-rate] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
