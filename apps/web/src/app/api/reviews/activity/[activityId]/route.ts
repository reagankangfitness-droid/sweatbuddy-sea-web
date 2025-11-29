import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getActivityReviews } from '@/lib/reviews'

/**
 * GET /api/reviews/activity/[activityId]
 * Get reviews for an activity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ activityId: string }> }
) {
  try {
    const { userId } = await auth()
    const { activityId } = await params

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = (searchParams.get('sortBy') || 'recent') as
      | 'recent'
      | 'highest'
      | 'lowest'
      | 'helpful'
    const filterRating = searchParams.get('rating')
      ? parseInt(searchParams.get('rating')!)
      : undefined

    const result = await getActivityReviews(
      activityId,
      { page, limit, sortBy, filterRating },
      userId || undefined
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching activity reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
