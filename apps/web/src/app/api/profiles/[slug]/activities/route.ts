import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHostedActivities, getAttendedActivities } from '@/lib/profile'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)

    const type = (searchParams.get('type') || 'hosted') as
      | 'hosted'
      | 'attended'
      | 'upcoming'
      | 'past'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Get profile
    const profile = await prisma.user.findUnique({
      where: { slug },
      select: {
        id: true,
        isHost: true,
        isPublic: true,
        showActivitiesAttended: true
      }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    let result

    if (type === 'attended') {
      // Check if attended activities are visible
      if (!profile.showActivitiesAttended) {
        return NextResponse.json({
          activities: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
            hasMore: false
          }
        })
      }

      result = await getAttendedActivities(profile.id, page, limit)
    } else if (type === 'upcoming') {
      // Get upcoming hosted activities
      result = await getHostedActivities(profile.id, 'upcoming', page, limit)
    } else if (type === 'past') {
      // Get past hosted activities
      result = await getHostedActivities(profile.id, 'past', page, limit)
    } else {
      // Get all hosted activities
      result = await getHostedActivities(profile.id, 'all', page, limit)
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Activities fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
