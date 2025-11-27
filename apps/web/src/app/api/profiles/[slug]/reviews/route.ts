import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHostReviews } from '@/lib/profile'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get profile
    const profile = await prisma.user.findUnique({
      where: { slug },
      select: { id: true, isHost: true }
    })

    if (!profile || !profile.isHost) {
      return NextResponse.json({ error: 'Host not found' }, { status: 404 })
    }

    const result = await getHostReviews(profile.id, page, limit)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    )
  }
}
