import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getFollowCounts } from '@/lib/profile'
import { getInterestBreakdown } from '@/lib/interest'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a host
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isHost: true },
    })

    if (!user?.isHost) {
      return NextResponse.json({ error: 'Not a host' }, { status: 403 })
    }

    // Fetch all demand data in parallel
    const [followCounts, newFollowers30d, recentFollowers, interestBreakdown, recentActivities] =
      await Promise.all([
        getFollowCounts(userId),
        prisma.userFollower.count({
          where: {
            followingId: userId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.userFollower.findMany({
          where: { followingId: userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            follower: {
              select: {
                id: true,
                name: true,
                firstName: true,
                imageUrl: true,
                slug: true,
              },
            },
          },
        }),
        getInterestBreakdown(userId),
        // Get last 50 activities for schedule pattern analysis
        prisma.activity.findMany({
          where: {
            OR: [{ userId }, { hostId: userId }],
            status: { in: ['PUBLISHED', 'COMPLETED'] },
            startTime: { not: null },
          },
          orderBy: { startTime: 'desc' },
          take: 50,
          select: {
            startTime: true,
            categorySlug: true,
          },
        }),
      ])

    // Compute typical schedule from recent activities
    const typicalSchedule = computeTypicalSchedule(recentActivities)

    return NextResponse.json({
      followers: {
        total: followCounts.followers,
        newLast30Days: newFollowers30d,
        recent: recentFollowers.map((f) => ({
          id: f.follower.id,
          name: f.follower.name,
          firstName: f.follower.firstName,
          imageUrl: f.follower.imageUrl,
          slug: f.follower.slug,
          followedAt: f.createdAt,
        })),
      },
      interest: interestBreakdown,
      typicalSchedule,
    })
  } catch (error) {
    console.error('Demand API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function computeTypicalSchedule(
  activities: { startTime: Date | null; categorySlug: string | null }[]
) {
  if (activities.length === 0) {
    return { dayOfWeek: null, hourOfDay: null, topCategory: null }
  }

  const dayCount: Record<number, number> = {}
  const hourCount: Record<number, number> = {}
  const categoryCount: Record<string, number> = {}

  for (const activity of activities) {
    if (!activity.startTime) continue
    const date = new Date(activity.startTime)

    const day = date.getDay()
    dayCount[day] = (dayCount[day] || 0) + 1

    const hour = date.getHours()
    hourCount[hour] = (hourCount[hour] || 0) + 1

    if (activity.categorySlug) {
      categoryCount[activity.categorySlug] =
        (categoryCount[activity.categorySlug] || 0) + 1
    }
  }

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const topDay = Object.entries(dayCount).sort(([, a], [, b]) => b - a)[0]
  const topHour = Object.entries(hourCount).sort(([, a], [, b]) => b - a)[0]
  const topCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]

  return {
    dayOfWeek: topDay ? dayNames[parseInt(topDay[0])] : null,
    hourOfDay: topHour ? parseInt(topHour[0]) : null,
    topCategory: topCategory ? topCategory[0] : null,
  }
}
