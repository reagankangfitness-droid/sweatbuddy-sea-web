import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getPublicProfile,
  getHostStats,
  getAttendedStats,
  getFollowCounts,
  isFollowing,
  trackProfileView
} from '@/lib/profile'
import { getInterestCount, isInterested } from '@/lib/interest'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Get profile
    const profile = await getPublicProfile(slug)

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

    // Get additional data - check if profile has full data (public profile)
    const showActivitiesAttended = 'showActivitiesAttended' in profile ? profile.showActivitiesAttended : false
    const showStats = 'showStats' in profile ? profile.showStats : false

    const [hostStats, attendedStats, followCounts, interestCount, communities, upcomingEvents] = await Promise.all([
      profile.isHost ? getHostStats(profile.id) : null,
      showActivitiesAttended || isOwnProfile
        ? getAttendedStats(profile.id)
        : null,
      getFollowCounts(profile.id),
      profile.isHost ? getInterestCount(profile.id) : 0,
      prisma.communityMember.findMany({
        where: { userId: profile.id },
        include: {
          community: {
            select: {
              name: true,
              slug: true,
              logoImage: true,
              category: true,
              memberCount: true,
            }
          }
        }
      }),
      (showActivitiesAttended || isOwnProfile)
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
    ])

    // Check if current user is following this profile and interested
    let isFollowingProfile = false
    let isInterestedInProfile = false
    if (userId && !isOwnProfile) {
      const [followStatus, interestStatus] = await Promise.all([
        isFollowing(userId, profile.id),
        profile.isHost ? isInterested(userId, profile.id) : false,
      ])
      isFollowingProfile = followStatus
      isInterestedInProfile = interestStatus
    }

    // Track profile view (don't await to avoid slowing response)
    if (!isOwnProfile) {
      trackProfileView(profile.id, userId || null, 'direct').catch(console.error)
    }

    // Strip email from public response (only used server-side for ownership check)
    const { email: _email, ...publicProfile } = profile as Record<string, unknown>
    return NextResponse.json({
      profile: {
        ...publicProfile,
        hostStats: showStats || isOwnProfile ? hostStats : null,
        attendedStats: showActivitiesAttended || isOwnProfile ? attendedStats : null,
        followCounts,
        interestCount,
      },
      communities: communities.map(cm => ({
        name: cm.community.name,
        slug: cm.community.slug,
        logoImage: cm.community.logoImage,
        category: cm.community.category,
        memberCount: cm.community.memberCount,
      })),
      upcomingEvents: Array.isArray(upcomingEvents) ? upcomingEvents.map((ua) => ({
        id: ua.activity.id,
        title: ua.activity.title,
        startTime: ua.activity.startTime,
        city: ua.activity.city,
        imageUrl: ua.activity.imageUrl,
        categorySlug: ua.activity.categorySlug,
      })) : [],
      isOwnProfile,
      isFollowing: isFollowingProfile,
      isInterested: isInterestedInProfile,
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
