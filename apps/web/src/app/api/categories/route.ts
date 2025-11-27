import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  ACTIVITY_CATEGORIES,
  CATEGORY_GROUPS,
  getCategoriesByGroup,
  getFeaturedCategories,
} from '@/lib/categories'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const featured = searchParams.get('featured')
    const group = searchParams.get('group')
    const withCounts = searchParams.get('withCounts')

    let categories = [...ACTIVITY_CATEGORIES]

    // Filter by featured
    if (featured === 'true') {
      categories = getFeaturedCategories()
    }

    // Filter by group
    if (group) {
      categories = getCategoriesByGroup(group)
    }

    // Add activity counts if requested
    if (withCounts === 'true') {
      const now = new Date()

      // Get counts for each category
      const counts = await prisma.activity.groupBy({
        by: ['categorySlug'],
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          startTime: {
            gte: now,
          },
        },
        _count: true,
      })

      const countMap = new Map(
        counts
          .filter((c) => c.categorySlug !== null)
          .map((c) => [c.categorySlug, c._count])
      )

      categories = categories.map((cat) => ({
        ...cat,
        activityCount: countMap.get(cat.slug) || 0,
      }))
    }

    // Build grouped response
    const grouped = CATEGORY_GROUPS.map((group) => ({
      ...group,
      categories: categories.filter((c) => c.groupSlug === group.slug),
    }))

    return NextResponse.json({
      categories,
      groups: CATEGORY_GROUPS,
      grouped,
    })
  } catch (error) {
    console.error('Categories error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
