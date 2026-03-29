import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getFullProfile,
  getAttendedStats,
  isFollowing,
  trackProfileView
} from '@/lib/profile'
import { isInterested } from '@/lib/interest'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Single combined query: profile + hostStats + communities + follow/interest counts
    const profile = await getFullProfile(slug)

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get current user session — check both ID and email to handle CUID vs Clerk ID mismatch
    const { userId } = await auth()
    let isOwnProfile = userId === profile.id
    if (!isOwnProfile && userId) {
      const clerkUser = await currentUser()
      const clerkEmail = clerkUser?.emailAddresses?.[0]?.emailAddress
      if (clerkEmail && 'email' in profile && profile.email && clerkEmail.toLowerCase() === profile.email.toLowerCase()) {
        isOwnProfile = true
      }
    }

    // If profile is private and not own profile, return limited data
    if (!profile.isPublic && !isOwnProfile) {
      return NextResponse.json({
        profile: {
          id: profile.id,
          name: profile.name,
          slug: profile.slug,
          imageUrl: profile.imageUrl,
          isPublic: false,
          isHost: profile.isHost
        },
        isOwnProfile: false
      })
    }

    // Profile is public — extract data from the combined query
    const showActivitiesAttended = 'showActivitiesAttended' in profile ? profile.showActivitiesAttended : false
    const showStats = 'showStats' in profile ? profile.showStats : false

    // Extract pre-loaded data from the combined query
    const hostStats = '_count' in profile ? ('hostStats' in profile ? profile.hostStats : null) : null
    const communities = 'communityMemberships' in profile ? profile.communityMemberships : []
    const followCounts = '_count' in profile
      ? { followers: profile._count.followers, following: profile._count.following }
      : { followers: 0, following: 0 }
    const interestCount = '_count' in profile ? profile._count.interestSignalsReceived : 0

    // Remaining queries that couldn't be combined — run in parallel
    // This replaces the original two sequential Promise.all blocks with one
    const needsAttendedStats = showActivitiesAttended || isOwnProfile
    const needsUpcomingEvents = showActivitiesAttended || isOwnProfile
    const needsFollowCheck = !!userId && !isOwnProfile
    const needsInterestCheck = !!userId && !isOwnProfile && profile.isHost

    const [attendedStats, upcomingEvents, followStatus, interestStatus, feedbackStats, activityInterests] = await Promise.all([
      needsAttendedStats
        ? getAttendedStats(profile.id)
        : null,
      needsUpcomingEvents
        ? prisma.userActivity.findMany({
            where: {
              userId: profile.id,
              status: 'JOINED',
              activity: {
                startTime: { gte: new Date() },
                status: 'PUBLISHED',
              }
            },
            take: 10,
            orderBy: { activity: { startTime: 'asc' } },
            include: {
              activity: {
                select: {
                  id: true,
                  title: true,
                  startTime: true,
                  city: true,
                  imageUrl: true,
                  categorySlug: true,
                }
              }
            }
          })
        : [],
      needsFollowCheck
        ? isFollowing(userId!, profile.id)
        : false,
      needsInterestCheck
        ? isInterested(userId!, profile.id)
        : false,
      // Feedback rating stats (reviews received as host)
      prisma.userReview.aggregate({
        where: { revieweeId: profile.id },
        _avg: { rating: true },
        _count: true,
      }),
      // Auto-populate activity interests from session history
      prisma.userActivity.findMany({
        where: {
          userId: profile.id,
          status: { in: ['JOINED', 'COMPLETED'] },
          activity: { categorySlug: { not: null } },
        },
        select: { activity: { select: { categorySlug: true } } },
        distinct: ['activityId'],
        take: 50,
      }),
    ])

    // Track profile view (don't await to avoid slowing response)
    if (!isOwnProfile) {
      trackProfileView(profile.id, userId || null, 'direct').catch(console.error)
    }

    // Build the public profile response, stripping internal fields
    const {
      email: _email,
      hostStats: _hostStats,
      communityMemberships: _memberships,
      _count,
      ...publicProfile
    } = profile as Record<string, unknown>

    const defaultHostStats = {
      totalEvents: 0,
      completedEvents: 0,
      totalUniqueAttendees: 0,
      averageRating: 0,
      totalReviews: 0,
      repeatAttendeeRate: 0,
      totalProfileViews: 0,
    }

    // Compute rating from feedback
    const rating = feedbackStats._count > 0
      ? { average: Math.round((feedbackStats._avg.rating ?? 0) * 10) / 10, count: feedbackStats._count }
      : null

    // Compute activity-based interests (top categories from sessions attended)
    const interestCounts: Record<string, number> = {}
    if (Array.isArray(activityInterests)) {
      for (const ua of activityInterests) {
        const slug = (ua as { activity: { categorySlug: string | null } }).activity.categorySlug
        if (slug) interestCounts[slug] = (interestCounts[slug] || 0) + 1
      }
    }
    const derivedInterests = Object.entries(interestCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([slug]) => slug)

    return NextResponse.json({
      profile: {
        ...publicProfile,
        hostStats: (showStats || isOwnProfile) ? (hostStats || defaultHostStats) : null,
        attendedStats: (showActivitiesAttended || isOwnProfile) ? attendedStats : null,
        followCounts,
        interestCount,
        rating,
        derivedInterests,
      },
      communities: Array.isArray(communities) ? communities.map((cm: { community: { name: string; slug: string | null; logoImage: string | null; category: string | null; memberCount: number } }) => ({
        name: cm.community.name,
        slug: cm.community.slug,
        logoImage: cm.community.logoImage,
        category: cm.community.category,
        memberCount: cm.community.memberCount,
      })) : [],
      upcomingEvents: Array.isArray(upcomingEvents) ? upcomingEvents.map((ua) => ({
        id: ua.activity.id,
        title: ua.activity.title,
        startTime: ua.activity.startTime,
        city: ua.activity.city,
        imageUrl: ua.activity.imageUrl,
        categorySlug: ua.activity.categorySlug,
      })) : [],
      isOwnProfile,
      isFollowing: followStatus,
      isInterested: interestStatus,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
