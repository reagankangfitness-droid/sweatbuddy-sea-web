import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { submitReview, canReviewBooking } from '@/lib/reviews'

/**
 * POST /api/reviews
 * Submit a new review
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { userActivityId, rating, title, content, photos } = body

    if (!userActivityId) {
      return NextResponse.json(
        { error: 'userActivityId is required' },
        { status: 400 }
      )
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if user can review
    const eligibility = await canReviewBooking(userActivityId, userId)
    if (!eligibility.canReview) {
      return NextResponse.json(
        { error: eligibility.reason || 'Cannot review this booking' },
        { status: 400 }
      )
    }

    const review = await submitReview({
      userActivityId,
      reviewerId: userId,
      rating,
      title,
      content,
      photos,
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Error submitting review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit review' },
      { status: 500 }
    )
  }
}
