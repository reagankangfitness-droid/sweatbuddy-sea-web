import { prisma } from '@/lib/prisma'

/**
 * Get a coach's full profile with user data
 */
export async function getCoachProfile(userId: string) {
  const coachProfile = await prisma.coachProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          slug: true,
          isCoach: true,
          coachType: true,
          coachVerificationStatus: true,
          coachVerifiedAt: true,
          coachBio: true,
          experienceYears: true,
          languages: true,
          hourlyRate: true,
          groupRate: true,
        },
      },
    },
  })

  return coachProfile
}

/**
 * Check if a user is a verified coach
 */
export async function isVerifiedCoach(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isCoach: true,
      coachVerificationStatus: true,
    },
  })

  return user?.isCoach === true && user?.coachVerificationStatus === 'VERIFIED'
}

/**
 * Search filters for coach discovery
 */
export interface CoachSearchFilters {
  city?: string
  sport?: string
  goal?: string
  minRating?: number
  maxPrice?: number
  page?: number
  limit?: number
}

/**
 * Search for coaches with filters and pagination
 */
export async function getCoachSearchResults(filters: CoachSearchFilters) {
  const {
    city,
    sport,
    goal,
    minRating,
    maxPrice,
    page = 1,
    limit = 20,
  } = filters

  const skip = (page - 1) * limit

  // Build where clause dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    isActive: true,
    user: {
      isCoach: true,
      coachVerificationStatus: 'VERIFIED',
    },
  }

  if (city) {
    where.serviceCity = {
      equals: city,
      mode: 'insensitive',
    }
  }

  if (sport) {
    where.sportsOffered = {
      has: sport,
    }
  }

  if (goal) {
    where.goalsServed = {
      has: goal,
    }
  }

  if (minRating !== undefined) {
    where.averageRating = {
      gte: minRating,
    }
  }

  if (maxPrice !== undefined) {
    where.sessionPrice = {
      lte: maxPrice,
    }
  }

  const [coaches, total] = await Promise.all([
    prisma.coachProfile.findMany({
      where,
      orderBy: [
        { averageRating: 'desc' },
        { totalReviews: 'desc' },
      ],
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            slug: true,
            coachBio: true,
            experienceYears: true,
            languages: true,
            hourlyRate: true,
            groupRate: true,
          },
        },
      },
    }),
    prisma.coachProfile.count({ where }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    coaches,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  }
}

/**
 * Recalculate denormalized metrics for a coach (average rating, total sessions, etc.)
 */
export async function updateCoachMetrics(userId: string) {
  // Get all reviews for activities hosted by this coach
  const reviewStats = await prisma.review.aggregate({
    where: {
      activity: {
        hostId: userId,
      },
    },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  // Count total sessions (completed activities)
  const totalSessions = await prisma.activity.count({
    where: {
      hostId: userId,
      status: 'COMPLETED',
    },
  })

  // Count total unique clients
  const totalClients = await prisma.userActivity.groupBy({
    by: ['userId'],
    where: {
      activity: {
        hostId: userId,
      },
      status: 'JOINED',
    },
  })

  await prisma.coachProfile.update({
    where: { userId },
    data: {
      averageRating: reviewStats._avg.rating ?? 0,
      totalReviews: reviewStats._count.id,
      totalSessions,
      totalStudents: totalClients.length,
    },
  })
}
