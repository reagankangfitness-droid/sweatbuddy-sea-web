/**
 * Profile utility functions for user/host profiles
 */

import { prisma } from '@/lib/prisma'

/**
 * Generate a unique slug for a user
 */
export async function generateUserSlug(name: string | null, userId: string): Promise<string> {
  const baseName = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)

  let slug = baseName
  let counter = 1

  // Check for uniqueness
  while (true) {
    const existing = await prisma.user.findFirst({
      where: {
        slug,
        NOT: { id: userId }
      }
    })

    if (!existing) break

    slug = `${baseName}-${counter}`
    counter++
  }

  return slug
}

/**
 * Public profile fields to select
 */
export const publicProfileSelect = {
  id: true,
  name: true,
  firstName: true,
  slug: true,
  imageUrl: true,
  coverImage: true,
  headline: true,
  bio: true,
  location: true,
  website: true,
  instagram: true,
  twitter: true,
  linkedin: true,
  tiktok: true,
  isHost: true,
  isVerified: true,
  isPublic: true,
  showActivitiesAttended: true,
  showStats: true,
  hostSince: true,
  specialties: true,
  certifications: true,
  createdAt: true
}

/**
 * Get public profile data for a user by slug
 */
export async function getPublicProfile(slug: string) {
  const user = await prisma.user.findUnique({
    where: { slug },
    select: publicProfileSelect
  })

  if (!user) return null

  // Check if profile is public
  if (!user.isPublic) {
    return {
      id: user.id,
      name: user.firstName || user.name?.split(' ')[0] || 'User',
      slug: user.slug,
      imageUrl: user.imageUrl,
      isPublic: false,
      isHost: user.isHost
    }
  }

  return user
}

/**
 * Get host stats for a user
 */
export async function getHostStats(userId: string) {
  const stats = await prisma.hostStats.findUnique({
    where: { hostId: userId },
    select: {
      totalEvents: true,
      completedEvents: true,
      totalUniqueAttendees: true,
      averageRating: true,
      totalReviews: true,
      repeatAttendeeRate: true,
      totalProfileViews: true
    }
  })

  return stats || {
    totalEvents: 0,
    completedEvents: 0,
    totalUniqueAttendees: 0,
    averageRating: 0,
    totalReviews: 0,
    repeatAttendeeRate: 0,
    totalProfileViews: 0
  }
}

/**
 * Get user's attended activities count
 */
export async function getAttendedStats(userId: string) {
  const [activitiesCount, hostsCount] = await Promise.all([
    prisma.userActivity.count({
      where: {
        userId,
        status: { in: ['JOINED', 'COMPLETED'] }
      }
    }),
    prisma.userActivity.findMany({
      where: {
        userId,
        status: { in: ['JOINED', 'COMPLETED'] }
      },
      select: {
        activity: {
          select: { hostId: true }
        }
      },
      distinct: ['activityId']
    })
  ])

  const uniqueHosts = new Set(hostsCount.map(ua => ua.activity.hostId).filter(Boolean)).size

  return {
    activitiesAttended: activitiesCount,
    uniqueHosts
  }
}

/**
 * Get follower/following counts for a user
 */
export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    prisma.userFollower.count({
      where: { followingId: userId }
    }),
    prisma.userFollower.count({
      where: { followerId: userId }
    })
  ])

  return { followers, following }
}

/**
 * Check if a user is following another user
 */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const follow = await prisma.userFollower.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  })

  return !!follow
}

/**
 * Toggle follow/unfollow a user
 */
export async function toggleFollow(followerId: string, followingId: string) {
  const existing = await prisma.userFollower.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId
      }
    }
  })

  if (existing) {
    await prisma.userFollower.delete({
      where: { id: existing.id }
    })
    return { following: false }
  } else {
    await prisma.userFollower.create({
      data: {
        followerId,
        followingId
      }
    })
    return { following: true }
  }
}

/**
 * Track profile view
 */
export async function trackProfileView(
  profileId: string,
  viewerId: string | null = null,
  source: string = 'direct'
) {
  await prisma.profileView.create({
    data: {
      profileId,
      viewerId,
      source,
      viewedAt: new Date()
    }
  })

  // Update profile view count in host_stats if host
  await prisma.hostStats.updateMany({
    where: { hostId: profileId },
    data: {
      totalProfileViews: { increment: 1 }
    }
  })
}

/**
 * Get reviews for a host
 */
export async function getHostReviews(
  hostId: string,
  page: number = 1,
  limit: number = 10
) {
  const offset = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    prisma.userReview.findMany({
      where: { revieweeId: hostId },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    }),
    prisma.userReview.count({
      where: { revieweeId: hostId }
    })
  ])

  // Get reviewer info and activity info for each review
  const enrichedReviews = await Promise.all(
    reviews.map(async (review) => {
      const [reviewer, activity] = await Promise.all([
        prisma.user.findUnique({
          where: { id: review.reviewerId },
          select: { id: true, name: true, firstName: true, imageUrl: true, slug: true }
        }),
        review.activityId
          ? prisma.activity.findUnique({
              where: { id: review.activityId },
              select: { id: true, title: true }
            })
          : null
      ])

      return {
        ...review,
        reviewer,
        activity
      }
    })
  )

  // Get rating distribution
  const ratingDistribution = await prisma.userReview.groupBy({
    by: ['rating'],
    where: { revieweeId: hostId },
    _count: { rating: true }
  })

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  ratingDistribution.forEach((r) => {
    distribution[r.rating] = r._count.rating
  })

  const totalPages = Math.ceil(total / limit)

  return {
    reviews: enrichedReviews,
    ratingDistribution: distribution,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
}

/**
 * Get hosted activities for a profile
 */
export async function getHostedActivities(
  userId: string,
  type: 'upcoming' | 'past' | 'all' = 'all',
  page: number = 1,
  limit: number = 12
) {
  const offset = (page - 1) * limit
  const now = new Date()

  const whereClause: any = {
    OR: [{ userId }, { hostId: userId }],
    status: { in: ['PUBLISHED', 'COMPLETED'] }
  }

  if (type === 'upcoming') {
    whereClause.startTime = { gte: now }
  } else if (type === 'past') {
    whereClause.startTime = { lt: now }
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where: whereClause,
      orderBy: { startTime: type === 'upcoming' ? 'asc' : 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        city: true,
        address: true,
        imageUrl: true,
        price: true,
        currency: true,
        maxPeople: true,
        categorySlug: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            userActivities: {
              where: { status: { in: ['JOINED', 'COMPLETED'] } }
            }
          }
        }
      }
    }),
    prisma.activity.count({ where: whereClause })
  ])

  const enrichedActivities = activities.map((activity) => ({
    ...activity,
    attendeesCount: activity._count.userActivities,
    spotsRemaining: activity.maxPeople
      ? activity.maxPeople - activity._count.userActivities
      : null
  }))

  const totalPages = Math.ceil(total / limit)

  return {
    activities: enrichedActivities,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
}

/**
 * Get attended activities for a user profile
 */
export async function getAttendedActivities(
  userId: string,
  page: number = 1,
  limit: number = 12
) {
  const offset = (page - 1) * limit

  const [userActivities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: {
        userId,
        status: { in: ['JOINED', 'COMPLETED'] }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        createdAt: true,
        activity: {
          select: {
            id: true,
            title: true,
            startTime: true,
            city: true,
            imageUrl: true,
            categorySlug: true,
            status: true,
            host: {
              select: {
                id: true,
                name: true,
                firstName: true,
                imageUrl: true,
                slug: true
              }
            }
          }
        }
      }
    }),
    prisma.userActivity.count({
      where: {
        userId,
        status: { in: ['JOINED', 'COMPLETED'] }
      }
    })
  ])

  const activities = userActivities.map((ua) => ({
    ...ua.activity,
    joinedAt: ua.createdAt
  }))

  const totalPages = Math.ceil(total / limit)

  return {
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    firstName?: string
    username?: string
    headline?: string
    bio?: string
    location?: string
    website?: string
    instagram?: string
    twitter?: string
    linkedin?: string
    tiktok?: string
    isPublic?: boolean
    showActivitiesAttended?: boolean
    showStats?: boolean
    specialties?: string[]
    certifications?: string[]
  }
) {
  // If username provided, check uniqueness
  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: {
        username: data.username.toLowerCase(),
        NOT: { id: userId }
      }
    })

    if (existing) {
      throw new Error('Username already taken')
    }

    data.username = data.username.toLowerCase()
  }

  // Generate new slug if name changed
  let slug: string | undefined
  if (data.name || data.firstName) {
    slug = await generateUserSlug(data.name || data.firstName || null, userId)
  }

  const updateData: any = {
    ...data,
    profileUpdatedAt: new Date()
  }

  if (slug) {
    updateData.slug = slug
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: publicProfileSelect
  })

  return updatedUser
}
