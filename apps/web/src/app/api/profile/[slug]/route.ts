import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import {
  getUserBySlug,
  getOrCreateUser,
  getEventStats,
  formatProfileSummary,
} from '@/lib/profile-events'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { slug } = await params

    // Get the profile user by slug
    let profileUser = await getUserBySlug(slug)

    if (!profileUser) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check if this is the current user's own profile
    const { userId } = await auth()
    let isOwnProfile = false
    let currentUserEmail: string | null = null

    if (userId) {
      const clerkUser = await currentUser()
      currentUserEmail = clerkUser?.primaryEmailAddress?.emailAddress || null

      if (currentUserEmail) {
        // Ensure current user exists in database
        await getOrCreateUser({
          id: userId,
          email: currentUserEmail,
          firstName: clerkUser?.firstName,
          fullName: clerkUser?.fullName,
          imageUrl: clerkUser?.imageUrl,
        })

        isOwnProfile = currentUserEmail.toLowerCase() === profileUser.email.toLowerCase()
      }
    }

    // Check privacy - if not public and not own profile, return limited data
    if (!profileUser.isPublic && !isOwnProfile) {
      return NextResponse.json({
        user: {
          slug: profileUser.slug,
          name: profileUser.name,
          imageUrl: profileUser.imageUrl,
          isPublic: false,
        },
        stats: null,
        summary: null,
        isOwnProfile: false,
        isPrivate: true,
      })
    }

    // Get event stats and earned badges for this user
    const [stats, earnedBadges] = await Promise.all([
      getEventStats(profileUser.email),
      prisma.earnedBadge.findMany({
        where: { userId: profileUser.id },
        select: {
          earnedAt: true,
          badge: {
            select: {
              slug: true,
              name: true,
              emoji: true,
            },
          },
        },
        orderBy: { earnedAt: 'desc' },
      }),
    ])

    // Format the summary
    const summary = formatProfileSummary(
      profileUser.name || profileUser.firstName || 'This user',
      stats
    )

    const badges = earnedBadges.map((eb) => ({
      slug: eb.badge.slug,
      name: eb.badge.name,
      emoji: eb.badge.emoji,
      earnedAt: eb.earnedAt.toISOString(),
    }))

    return NextResponse.json({
      user: {
        id: profileUser.id,
        slug: profileUser.slug,
        name: profileUser.name,
        firstName: profileUser.firstName,
        imageUrl: profileUser.imageUrl,
        bio: profileUser.bio,
        headline: profileUser.headline,
        location: profileUser.location,
        website: profileUser.website,
        instagram: profileUser.instagram,
        twitter: profileUser.twitter,
        createdAt: profileUser.createdAt,
        isPublic: profileUser.isPublic,
      },
      stats,
      summary,
      badges,
      isOwnProfile,
      isPrivate: false,
    })
  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}
