import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { addHostResponse, updateHostResponse } from '@/lib/reviews'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/reviews/[reviewId]/respond
 * Add or update host response to a review
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
    const body = await request.json()
    const { content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Response content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Response must be under 2000 characters' },
        { status: 400 }
      )
    }

    // Check if there's already a response
    const existingResponse = await prisma.reviewResponse.findUnique({
      where: { reviewId },
    })

    if (existingResponse) {
      await updateHostResponse(existingResponse.id, userId, content.trim())
    } else {
      await addHostResponse(reviewId, userId, content.trim())
    }

    // Get the updated review with response
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { hostResponse: true },
    })

    return NextResponse.json(review?.hostResponse)
  } catch (error) {
    console.error('Error responding to review:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to respond' },
      { status: 500 }
    )
  }
}
