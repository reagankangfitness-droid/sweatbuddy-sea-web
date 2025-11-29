import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { toggleHelpfulVote } from '@/lib/reviews'

/**
 * POST /api/reviews/[reviewId]/helpful
 * Toggle helpful vote on a review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reviewId } = await params

    const result = await toggleHelpfulVote(reviewId, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error toggling helpful vote:', error)
    return NextResponse.json(
      { error: 'Failed to toggle vote' },
      { status: 500 }
    )
  }
}
