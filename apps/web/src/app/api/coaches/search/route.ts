import { NextRequest, NextResponse } from 'next/server'
import { getCoachSearchResults } from '@/lib/coach'

/**
 * GET /api/coaches/search
 * Search for coaches (public, no auth required)
 * Query params: ?city=singapore&sport=tennis&goal=lose-weight&minRating=4.0&maxPrice=10000&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const city = searchParams.get('city') || undefined
    const sport = searchParams.get('sport') || undefined
    const goal = searchParams.get('goal') || undefined
    const minRating = searchParams.get('minRating')
      ? parseFloat(searchParams.get('minRating')!)
      : undefined
    const maxPrice = searchParams.get('maxPrice')
      ? parseFloat(searchParams.get('maxPrice')!)
      : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Cap at 50

    const result = await getCoachSearchResults({
      city,
      sport,
      goal,
      minRating,
      maxPrice,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Coach search error:', error)
    return NextResponse.json(
      { error: 'Failed to search coaches' },
      { status: 500 }
    )
  }
}
