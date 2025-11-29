import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getHostReviews } from '@/lib/reviews'

/**
 * GET /api/host/reviews
 * Get all reviews for the current host
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = (searchParams.get('sortBy') || 'recent') as
      | 'recent'
      | 'highest'
      | 'lowest'
      | 'helpful'
    const filterRating = searchParams.get('rating')
      ? parseInt(searchParams.get('rating')!)
      : undefined
    const filter = searchParams.get('filter') || 'all' // 'all', 'needs_response', 'responded'

    let result = await getHostReviews(userId, { page, limit, sortBy, filterRating })

    // Apply filter
    if (filter === 'needs_response') {
      result.reviews = result.reviews.filter((r) => !r.hostResponse)
    } else if (filter === 'responded') {
      result.reviews = result.reviews.filter((r) => !!r.hostResponse)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching host reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
