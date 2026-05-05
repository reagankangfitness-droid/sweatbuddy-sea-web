import { NextRequest, NextResponse } from 'next/server'
import { submitReview, canReviewBooking } from '@/lib/reviews'
import { getCurrentDbUser } from '@/lib/current-user'

/**
 * POST /api/reviews
 * Submit a new review
 */
export async function POST(request: NextRequest) {
  try {
    const dbUser = await getCurrentDbUser()

    if (!dbUser) {
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
    const eligibility = await canReviewBooking(userActivityId, dbUser.id)
    if (!eligibility.canReview) {
      return NextResponse.json(
        { error: eligibility.reason || 'Cannot review this booking' },
        { status: 400 }
      )
    }

    const review = await submitReview({
      userActivityId,
      reviewerId: dbUser.id,
      rating,
      title,
      content,
      photos,
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : (error instanceof Error ? error.message : 'Failed to submit review') },
      { status: 500 }
    )
  }
}
