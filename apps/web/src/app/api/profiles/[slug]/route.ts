import { auth } from '@clerk/nextjs/server'
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

    // Get current user session
    const { userId } = await auth()
    const isOwnProfile = userId === profile.id

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

    const [hostStats, attendedStats, followCounts] = await Promise.all([
      profile.isHost ? getHostStats(profile.id) : null,
      showActivitiesAttended || isOwnProfile
        ? getAttendedStats(profile.id)
        : null,
      getFollowCounts(profile.id)
    ])

    // Check if current user is following this profile
    let isFollowingProfile = false
    if (userId && !isOwnProfile) {
      isFollowingProfile = await isFollowing(userId, profile.id)
    }

    // Track profile view (don't await to avoid slowing response)
    if (!isOwnProfile) {
      trackProfileView(profile.id, userId || null, 'direct').catch(console.error)
    }

    return NextResponse.json({
      profile: {
        ...profile,
        hostStats: showStats || isOwnProfile ? hostStats : null,
        attendedStats: showActivitiesAttended || isOwnProfile ? attendedStats : null,
        followCounts
      },
      isOwnProfile,
      isFollowing: isFollowingProfile
    })
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
