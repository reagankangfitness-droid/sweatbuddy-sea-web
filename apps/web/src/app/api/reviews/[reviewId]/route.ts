import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateReview, deleteReview } from '@/lib/reviews'

/**
 * GET /api/reviews/[reviewId]
 * Get a single review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const { userId } = await auth()

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewer: {
          select: { id: true, name: true, imageUrl: true },
        },
        activity: {
          select: { id: true, title: true, imageUrl: true },
        },
        hostResponse: true,
        helpfulVotes: userId
          ? {
              where: { userId },
              take: 1,
            }
          : false,
      },
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    if (review.status !== 'PUBLISHED' && review.reviewerId !== userId) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...review,
      userHasVotedHelpful: userId
        ? (review.helpfulVotes as Array<{ userId: string }>)?.length > 0
        : false,
      helpfulVotes: undefined,
    })
  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/reviews/[reviewId]
 * Update a review
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await params
    const body = await request.json()
    const { rating, title, content, photos } = body

    const review = await updateReview(reviewId, userId, {
      rating,
      title,
      content,
      photos,
    })

    return NextResponse.json(review)
  } catch (error) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/reviews/[reviewId]
 * Delete a review
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await params

    await deleteReview(reviewId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete review' },
      { status: 500 }
    )
  }
}
