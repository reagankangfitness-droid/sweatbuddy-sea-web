import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { canReviewBooking } from '@/lib/reviews'

/**
 * GET /api/reviews/eligibility/[userActivityId]
 * Check if user can review a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userActivityId: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userActivityId } = await params

    const result = await canReviewBooking(userActivityId, userId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error checking review eligibility:', error)
    return NextResponse.json(
      { error: 'Failed to check eligibility' },
      { status: 500 }
    )
  }
}
