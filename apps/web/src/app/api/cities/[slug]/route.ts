import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cities/[slug] - Get city details with communities and events
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const city = await prisma.city.findUnique({
      where: { slug },
    })

    if (!city) {
      return NextResponse.json({ error: 'City not found' }, { status: 404 })
    }

    // Get communities in this city
    const communityWhere: Record<string, unknown> = {
      cityId: city.id,
      isActive: true,
    }
    if (category) {
      communityWhere.category = category
    }

    const communities = await prisma.community.findMany({
      where: communityWhere,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            username: true,
            imageUrl: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            members: true,
            activities: true,
          },
        },
      },
      orderBy: { memberCount: 'desc' },
      take: 20,
    })

    // Get upcoming events in this city (from communities)
    const upcomingEvents = await prisma.activity.findMany({
      where: {
        community: {
          cityId: city.id,
          isActive: true,
        },
        status: 'PUBLISHED',
        startTime: { gte: new Date() },
      },
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        host: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            userActivities: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 20,
    })

    // Get category counts
    const categoryCountsRaw = await prisma.community.groupBy({
      by: ['category'],
      where: {
        cityId: city.id,
        isActive: true,
      },
      _count: {
        category: true,
      },
    })

    const categoryCounts = categoryCountsRaw.map((c) => ({
      category: c.category,
      count: c._count.category,
    }))

    return NextResponse.json({
      city,
      communities,
      upcomingEvents,
      categoryCounts,
    })
  } catch (error) {
    console.error('Get city error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
