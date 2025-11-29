import { prisma } from '@/lib/prisma'
import { sendEmail, formatDate, formatTime } from '@/lib/email'
import type {
  Review,
  ReviewStatus,
  ReviewPromptStatus,
  Activity,
  User,
  UserActivity,
} from '@prisma/client'

// Re-export types
export type { ReviewStatus, ReviewPromptStatus }

// Constants
const REVIEW_EDIT_WINDOW_HOURS = 48
const REVIEW_PROMPT_DELAY_HOURS = 2 // Send prompt 2 hours after activity ends
const REVIEW_REMINDER_DELAY_DAYS = 3 // Send reminder 3 days after first prompt
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sweatbuddies.co'

// Types
export interface ReviewWithDetails extends Review {
  reviewer: Pick<User, 'id' | 'name' | 'imageUrl'>
  activity: Pick<Activity, 'id' | 'title' | 'imageUrl'>
  hostResponse?: {
    id: string
    content: string
    createdAt: Date
    editedAt: Date | null
  } | null
  userHasVotedHelpful?: boolean
}

export interface ActivityRatingSummary {
  averageRating: number
  totalReviews: number
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

export interface HostRatingSummary {
  averageRating: number
  totalReviews: number
  totalActivities: number
  responseRate: number
  distribution: {
    fiveStar: number
    fourStar: number
    threeStar: number
    twoStar: number
    oneStar: number
  }
}

// =====================================================
// REVIEW SUBMISSION
// =====================================================

interface SubmitReviewParams {
  userActivityId: string
  reviewerId: string
  rating: number
  title?: string
  content?: string
  photos?: string[]
}

/**
 * Submit a new review for a booking
 */
export async function submitReview(params: SubmitReviewParams): Promise<Review> {
  const { userActivityId, reviewerId, rating, title, content, photos } = params

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Get the booking and verify eligibility
  const booking = await prisma.userActivity.findUnique({
    where: { id: userActivityId },
    include: {
      activity: {
        select: { id: true, userId: true, hostId: true, endTime: true, startTime: true },
      },
      review: true,
    },
  })

  if (!booking) {
    throw new Error('Booking not found')
  }

  if (booking.userId !== reviewerId) {
    throw new Error('You can only review your own bookings')
  }

  if (booking.status !== 'JOINED' && booking.status !== 'COMPLETED') {
    throw new Error('You can only review activities you attended')
  }

  // Check if activity has ended
  const activityEndTime = booking.activity.endTime || booking.activity.startTime
  if (activityEndTime && new Date(activityEndTime) > new Date()) {
    throw new Error('You can only review after the activity has ended')
  }

  if (booking.review) {
    throw new Error('You have already reviewed this booking')
  }

  // Determine the host ID
  const hostId = booking.activity.hostId || booking.activity.userId

  // Create the review
  const review = await prisma.review.create({
    data: {
      activityId: booking.activityId,
      userActivityId,
      reviewerId,
      hostId,
      rating,
      title: title || null,
      content: content || null,
      photos: photos || [],
      status: 'PUBLISHED',
      isVerified: true,
    },
  })

  // Update rating summaries
  await updateActivityRatingSummary(booking.activityId)
  await updateHostRatingSummary(hostId)

  // Mark review prompt as completed if exists
  await prisma.reviewPrompt.updateMany({
    where: { userActivityId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
    },
  })

  // Notify the host
  await notifyHostOfNewReview(review.id)

  return review
}

/**
 * Update an existing review (within edit window)
 */
export async function updateReview(
  reviewId: string,
  reviewerId: string,
  data: { rating?: number; title?: string; content?: string; photos?: string[] }
): Promise<Review> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  if (review.reviewerId !== reviewerId) {
    throw new Error('You can only edit your own reviews')
  }

  // Check edit window
  const hoursSinceCreation =
    (Date.now() - new Date(review.createdAt).getTime()) / (1000 * 60 * 60)
  if (hoursSinceCreation > REVIEW_EDIT_WINDOW_HOURS) {
    throw new Error(`Reviews can only be edited within ${REVIEW_EDIT_WINDOW_HOURS} hours`)
  }

  if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Rating must be between 1 and 5')
  }

  const oldRating = review.rating

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...data,
      editedAt: new Date(),
      editCount: { increment: 1 },
    },
  })

  // Update rating summaries if rating changed
  if (data.rating !== undefined && data.rating !== oldRating) {
    await updateActivityRatingSummary(review.activityId)
    await updateHostRatingSummary(review.hostId)
  }

  return updatedReview
}

/**
 * Delete a review (soft delete)
 */
export async function deleteReview(reviewId: string, reviewerId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  if (review.reviewerId !== reviewerId) {
    throw new Error('You can only delete your own reviews')
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { status: 'DELETED' },
  })

  // Update rating summaries
  await updateActivityRatingSummary(review.activityId)
  await updateHostRatingSummary(review.hostId)
}

// =====================================================
// HOST RESPONSES
// =====================================================

/**
 * Add a host response to a review
 */
export async function addHostResponse(
  reviewId: string,
  hostId: string,
  content: string
): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { hostResponse: true },
  })

  if (!review) {
    throw new Error('Review not found')
  }

  if (review.hostId !== hostId) {
    throw new Error('Only the host can respond to this review')
  }

  if (review.hostResponse) {
    throw new Error('You have already responded to this review')
  }

  await prisma.reviewResponse.create({
    data: {
      reviewId,
      hostId,
      content,
    },
  })

  // Update host response rate
  await updateHostRatingSummary(hostId)

  // Notify the reviewer
  await notifyReviewerOfResponse(reviewId)
}

/**
 * Update a host response
 */
export async function updateHostResponse(
  responseId: string,
  hostId: string,
  content: string
): Promise<void> {
  const response = await prisma.reviewResponse.findUnique({
    where: { id: responseId },
  })

  if (!response) {
    throw new Error('Response not found')
  }

  if (response.hostId !== hostId) {
    throw new Error('You can only edit your own responses')
  }

  await prisma.reviewResponse.update({
    where: { id: responseId },
    data: {
      content,
      editedAt: new Date(),
    },
  })
}

// =====================================================
// HELPFUL VOTES
// =====================================================

/**
 * Toggle helpful vote on a review
 */
export async function toggleHelpfulVote(
  reviewId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }> {
  const existingVote = await prisma.reviewHelpfulVote.findUnique({
    where: {
      reviewId_userId: { reviewId, userId },
    },
  })

  if (existingVote) {
    // Remove vote
    await prisma.reviewHelpfulVote.delete({
      where: { id: existingVote.id },
    })
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { decrement: 1 } },
    })
    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    return { voted: false, newCount: review?.helpfulCount || 0 }
  } else {
    // Add vote
    await prisma.reviewHelpfulVote.create({
      data: { reviewId, userId },
    })
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulCount: { increment: 1 } },
    })
    const review = await prisma.review.findUnique({ where: { id: reviewId } })
    return { voted: true, newCount: review?.helpfulCount || 0 }
  }
}

// =====================================================
// FETCHING REVIEWS
// =====================================================

interface GetReviewsOptions {
  page?: number
  limit?: number
  sortBy?: 'recent' | 'highest' | 'lowest' | 'helpful'
  filterRating?: number
}

/**
 * Get reviews for an activity
 */
export async function getActivityReviews(
  activityId: string,
  options: GetReviewsOptions = {},
  currentUserId?: string
): Promise<{ reviews: ReviewWithDetails[]; total: number; summary: ActivityRatingSummary }> {
  const { page = 1, limit = 10, sortBy = 'recent', filterRating } = options

  const where = {
    activityId,
    status: 'PUBLISHED' as ReviewStatus,
    ...(filterRating ? { rating: filterRating } : {}),
  }

  const orderBy = {
    recent: { createdAt: 'desc' as const },
    highest: { rating: 'desc' as const },
    lowest: { rating: 'asc' as const },
    helpful: { helpfulCount: 'desc' as const },
  }[sortBy]

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, imageUrl: true },
        },
        activity: {
          select: { id: true, title: true, imageUrl: true },
        },
        hostResponse: true,
        helpfulVotes: currentUserId
          ? {
              where: { userId: currentUserId },
              take: 1,
            }
          : false,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  // Get or calculate summary
  const summary = await getActivityRatingSummary(activityId)

  // Transform to include userHasVotedHelpful
  const reviewsWithDetails = reviews.map((review) => ({
    ...review,
    userHasVotedHelpful: currentUserId
      ? (review.helpfulVotes as Array<{ userId: string }>)?.length > 0
      : false,
    helpfulVotes: undefined, // Remove the array from response
  })) as unknown as ReviewWithDetails[]

  return { reviews: reviewsWithDetails, total, summary }
}

/**
 * Get reviews for a host
 */
export async function getHostReviews(
  hostId: string,
  options: GetReviewsOptions = {}
): Promise<{ reviews: ReviewWithDetails[]; total: number; summary: HostRatingSummary }> {
  const { page = 1, limit = 20, sortBy = 'recent', filterRating } = options

  const where = {
    hostId,
    status: 'PUBLISHED' as ReviewStatus,
    ...(filterRating ? { rating: filterRating } : {}),
  }

  const orderBy = {
    recent: { createdAt: 'desc' as const },
    highest: { rating: 'desc' as const },
    lowest: { rating: 'asc' as const },
    helpful: { helpfulCount: 'desc' as const },
  }[sortBy]

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: { id: true, name: true, imageUrl: true },
        },
        activity: {
          select: { id: true, title: true, imageUrl: true },
        },
        hostResponse: true,
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ])

  const summary = await getHostRatingSummary(hostId)

  return {
    reviews: reviews as unknown as ReviewWithDetails[],
    total,
    summary,
  }
}

/**
 * Check if user can review a booking
 */
export async function canReviewBooking(
  userActivityId: string,
  userId: string
): Promise<{ canReview: boolean; canEdit?: boolean; reason?: string; existingReview?: Review }> {
  const booking = await prisma.userActivity.findUnique({
    where: { id: userActivityId },
    include: {
      activity: {
        select: { endTime: true, startTime: true },
      },
      review: true,
    },
  })

  if (!booking) {
    return { canReview: false, reason: 'Booking not found' }
  }

  if (booking.userId !== userId) {
    return { canReview: false, reason: 'Not your booking' }
  }

  if (booking.status !== 'JOINED' && booking.status !== 'COMPLETED') {
    return { canReview: false, reason: 'You did not attend this activity' }
  }

  const activityEndTime = booking.activity.endTime || booking.activity.startTime
  if (activityEndTime && new Date(activityEndTime) > new Date()) {
    return { canReview: false, reason: 'Activity has not ended yet' }
  }

  if (booking.review) {
    // Check if within edit window
    const createdAt = new Date(booking.review.createdAt)
    const now = new Date()
    const hoursSinceCreation =
      (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
    const canEdit = hoursSinceCreation <= REVIEW_EDIT_WINDOW_HOURS

    return {
      canReview: canEdit, // Can edit if within window
      canEdit,
      reason: canEdit ? undefined : 'Edit window expired',
      existingReview: booking.review,
    }
  }

  return { canReview: true }
}

// =====================================================
// RATING SUMMARIES
// =====================================================

/**
 * Get activity rating summary
 */
export async function getActivityRatingSummary(
  activityId: string
): Promise<ActivityRatingSummary> {
  let summary = await prisma.activityRatingSummary.findUnique({
    where: { activityId },
  })

  if (!summary) {
    // Calculate from reviews
    await updateActivityRatingSummary(activityId)
    summary = await prisma.activityRatingSummary.findUnique({
      where: { activityId },
    })
  }

  if (!summary) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    }
  }

  return {
    averageRating: Number(summary.averageRating),
    totalReviews: summary.totalReviews,
    distribution: {
      fiveStar: summary.fiveStarCount,
      fourStar: summary.fourStarCount,
      threeStar: summary.threeStarCount,
      twoStar: summary.twoStarCount,
      oneStar: summary.oneStarCount,
    },
  }
}

/**
 * Get host rating summary
 */
export async function getHostRatingSummary(hostId: string): Promise<HostRatingSummary> {
  let summary = await prisma.hostRatingSummary.findUnique({
    where: { hostId },
  })

  if (!summary) {
    await updateHostRatingSummary(hostId)
    summary = await prisma.hostRatingSummary.findUnique({
      where: { hostId },
    })
  }

  if (!summary) {
    return {
      averageRating: 0,
      totalReviews: 0,
      totalActivities: 0,
      responseRate: 0,
      distribution: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    }
  }

  // Count unique activities with reviews
  const uniqueActivities = await prisma.review.groupBy({
    by: ['activityId'],
    where: {
      hostId,
      status: 'PUBLISHED',
    },
  })

  return {
    averageRating: Number(summary.averageRating),
    totalReviews: summary.totalReviews,
    totalActivities: uniqueActivities.length,
    responseRate: Number(summary.responseRate),
    distribution: {
      fiveStar: summary.fiveStarCount,
      fourStar: summary.fourStarCount,
      threeStar: summary.threeStarCount,
      twoStar: summary.twoStarCount,
      oneStar: summary.oneStarCount,
    },
  }
}

/**
 * Update activity rating summary using database aggregations (optimized)
 */
async function updateActivityRatingSummary(activityId: string): Promise<void> {
  // Use database aggregation instead of loading all reviews
  const [stats, distribution, lastReview] = await Promise.all([
    // Get count and average in one query
    prisma.review.aggregate({
      where: { activityId, status: 'PUBLISHED' },
      _count: true,
      _avg: { rating: true },
    }),
    // Get distribution counts in one query
    prisma.review.groupBy({
      by: ['rating'],
      where: { activityId, status: 'PUBLISHED' },
      _count: true,
    }),
    // Get last review date
    prisma.review.findFirst({
      where: { activityId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  const totalReviews = stats._count
  const averageRating = stats._avg.rating || 0

  // Convert distribution array to object
  const distMap = new Map(distribution.map((d) => [d.rating, d._count]))

  await prisma.activityRatingSummary.upsert({
    where: { activityId },
    create: {
      activityId,
      averageRating,
      totalReviews,
      fiveStarCount: distMap.get(5) || 0,
      fourStarCount: distMap.get(4) || 0,
      threeStarCount: distMap.get(3) || 0,
      twoStarCount: distMap.get(2) || 0,
      oneStarCount: distMap.get(1) || 0,
      lastReviewAt: lastReview?.createdAt || null,
    },
    update: {
      averageRating,
      totalReviews,
      fiveStarCount: distMap.get(5) || 0,
      fourStarCount: distMap.get(4) || 0,
      threeStarCount: distMap.get(3) || 0,
      twoStarCount: distMap.get(2) || 0,
      oneStarCount: distMap.get(1) || 0,
      lastReviewAt: lastReview?.createdAt || null,
    },
  })
}

/**
 * Update host rating summary using database aggregations (optimized)
 */
async function updateHostRatingSummary(hostId: string): Promise<void> {
  // Use database aggregations instead of loading all reviews
  const [stats, distribution, responseCount, lastReview] = await Promise.all([
    // Get count and average
    prisma.review.aggregate({
      where: { hostId, status: 'PUBLISHED' },
      _count: true,
      _avg: { rating: true },
    }),
    // Get distribution counts
    prisma.review.groupBy({
      by: ['rating'],
      where: { hostId, status: 'PUBLISHED' },
      _count: true,
    }),
    // Count reviews with responses
    prisma.reviewResponse.count({
      where: {
        hostId,
        review: { status: 'PUBLISHED' },
      },
    }),
    // Get last review date
    prisma.review.findFirst({
      where: { hostId, status: 'PUBLISHED' },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    }),
  ])

  const totalReviews = stats._count
  const averageRating = stats._avg.rating || 0
  const responseRate = totalReviews > 0 ? (responseCount / totalReviews) * 100 : 0

  // Convert distribution array to map
  const distMap = new Map(distribution.map((d) => [d.rating, d._count]))

  await prisma.hostRatingSummary.upsert({
    where: { hostId },
    create: {
      hostId,
      averageRating,
      totalReviews,
      totalResponses: responseCount,
      responseRate,
      fiveStarCount: distMap.get(5) || 0,
      fourStarCount: distMap.get(4) || 0,
      threeStarCount: distMap.get(3) || 0,
      twoStarCount: distMap.get(2) || 0,
      oneStarCount: distMap.get(1) || 0,
      lastReviewAt: lastReview?.createdAt || null,
    },
    update: {
      averageRating,
      totalReviews,
      totalResponses: responseCount,
      responseRate,
      fiveStarCount: distMap.get(5) || 0,
      fourStarCount: distMap.get(4) || 0,
      threeStarCount: distMap.get(3) || 0,
      twoStarCount: distMap.get(2) || 0,
      oneStarCount: distMap.get(1) || 0,
      lastReviewAt: lastReview?.createdAt || null,
    },
  })
}

// =====================================================
// REVIEW PROMPTS
// =====================================================

/**
 * Schedule a review prompt for a booking
 */
export async function scheduleReviewPrompt(
  userActivityId: string,
  activityId: string,
  userId: string,
  activityEndTime: Date
): Promise<void> {
  const scheduledFor = new Date(
    activityEndTime.getTime() + REVIEW_PROMPT_DELAY_HOURS * 60 * 60 * 1000
  )
  const reminderAt = new Date(
    scheduledFor.getTime() + REVIEW_REMINDER_DELAY_DAYS * 24 * 60 * 60 * 1000
  )

  await prisma.reviewPrompt.upsert({
    where: { userActivityId },
    create: {
      userActivityId,
      activityId,
      userId,
      scheduledFor,
      reminderAt,
      status: 'PENDING',
    },
    update: {
      scheduledFor,
      reminderAt,
      status: 'PENDING',
    },
  })
}

/**
 * Process due review prompts (called by cron)
 */
export async function processDueReviewPrompts(): Promise<{
  processed: number
  sent: number
  failed: number
}> {
  const now = new Date()

  const duePrompts = await prisma.reviewPrompt.findMany({
    where: {
      status: 'PENDING',
      scheduledFor: { lte: now },
    },
    take: 50,
  })

  if (duePrompts.length === 0) {
    return { processed: 0, sent: 0, failed: 0 }
  }

  // Batch check for existing reviews (avoid N+1)
  const userActivityIds = duePrompts.map((p) => p.userActivityId)
  const existingReviews = await prisma.review.findMany({
    where: { userActivityId: { in: userActivityIds } },
    select: { userActivityId: true },
  })
  const reviewedIds = new Set(existingReviews.map((r) => r.userActivityId))

  // Batch update prompts that already have reviews
  const completedPromptIds = duePrompts
    .filter((p) => reviewedIds.has(p.userActivityId))
    .map((p) => p.id)

  if (completedPromptIds.length > 0) {
    await prisma.reviewPrompt.updateMany({
      where: { id: { in: completedPromptIds } },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }

  // Process remaining prompts
  const promptsToSend = duePrompts.filter((p) => !reviewedIds.has(p.userActivityId))
  let sent = 0
  let failed = 0

  for (const prompt of promptsToSend) {
    try {
      const success = await sendReviewPromptEmail(prompt.userActivityId)

      if (success) {
        await prisma.reviewPrompt.update({
          where: { id: prompt.id },
          data: { status: 'SENT', sentAt: new Date() },
        })
        sent++
      } else {
        failed++
      }
    } catch (error) {
      console.error(`Error processing review prompt ${prompt.id}:`, error)
      failed++
    }
  }

  return { processed: duePrompts.length, sent, failed }
}

/**
 * Process review reminders (called by cron)
 */
export async function processReviewReminders(): Promise<{
  processed: number
  sent: number
}> {
  const now = new Date()

  const dueReminders = await prisma.reviewPrompt.findMany({
    where: {
      status: 'SENT',
      reminderAt: { lte: now },
      reminderSentAt: null,
    },
    take: 50,
  })

  if (dueReminders.length === 0) {
    return { processed: 0, sent: 0 }
  }

  // Batch check for existing reviews (avoid N+1)
  const userActivityIds = dueReminders.map((p) => p.userActivityId)
  const existingReviews = await prisma.review.findMany({
    where: { userActivityId: { in: userActivityIds } },
    select: { userActivityId: true },
  })
  const reviewedIds = new Set(existingReviews.map((r) => r.userActivityId))

  // Batch update prompts that already have reviews
  const completedPromptIds = dueReminders
    .filter((p) => reviewedIds.has(p.userActivityId))
    .map((p) => p.id)

  if (completedPromptIds.length > 0) {
    await prisma.reviewPrompt.updateMany({
      where: { id: { in: completedPromptIds } },
      data: { status: 'COMPLETED', completedAt: new Date() },
    })
  }

  // Process remaining reminders
  const remindersToSend = dueReminders.filter((p) => !reviewedIds.has(p.userActivityId))
  let sent = 0

  for (const prompt of remindersToSend) {
    try {
      const success = await sendReviewReminderEmail(prompt.userActivityId)

      if (success) {
        await prisma.reviewPrompt.update({
          where: { id: prompt.id },
          data: { reminderSentAt: new Date() },
        })
        sent++
      }
    } catch (error) {
      console.error(`Error sending review reminder ${prompt.id}:`, error)
    }
  }

  return { processed: dueReminders.length, sent }
}

// =====================================================
// EMAIL NOTIFICATIONS
// =====================================================

async function sendReviewPromptEmail(userActivityId: string): Promise<boolean> {
  const booking = await prisma.userActivity.findUnique({
    where: { id: userActivityId },
    include: {
      user: { select: { name: true, email: true } },
      activity: {
        select: { id: true, title: true, imageUrl: true },
        include: {
          user: { select: { name: true } },
        },
      },
    },
  })

  if (!booking || !booking.user.email) return false

  const reviewUrl = `${BASE_URL}/review/${userActivityId}`

  const html = buildReviewPromptEmailHtml({
    userName: booking.user.name || 'there',
    activityTitle: booking.activity.title,
    activityImage: booking.activity.imageUrl,
    hostName: booking.activity.user.name || 'your host',
    reviewUrl,
  })

  const result = await sendEmail({
    to: booking.user.email,
    subject: `How was ${booking.activity.title}?`,
    html,
  })

  return result.success
}

async function sendReviewReminderEmail(userActivityId: string): Promise<boolean> {
  const booking = await prisma.userActivity.findUnique({
    where: { id: userActivityId },
    include: {
      user: { select: { name: true, email: true } },
      activity: { select: { id: true, title: true } },
    },
  })

  if (!booking || !booking.user.email) return false

  const reviewUrl = `${BASE_URL}/review/${userActivityId}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Quick Reminder</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; padding: 32px;">
          <tr>
            <td style="text-align: center;">
              <h1 style="margin: 0 0 16px 0; color: #171717; font-size: 24px;">
                Still thinking about your review?
              </h1>
              <p style="margin: 0 0 24px 0; color: #525252; font-size: 16px; line-height: 1.5;">
                Hey ${booking.user.name || 'there'}, your feedback for <strong>${booking.activity.title}</strong> would really help other SweatBuddies!
              </p>
              <a href="${reviewUrl}" style="display: inline-block; background: #10b981; color: #FFFFFF; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-size: 16px; font-weight: 600;">
                Write Your Review
              </a>
              <p style="margin: 24px 0 0 0; color: #9ca3af; font-size: 13px;">
                It only takes a minute!
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const result = await sendEmail({
    to: booking.user.email,
    subject: `Quick reminder: Share your experience`,
    html,
  })

  return result.success
}

async function notifyHostOfNewReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      host: { select: { email: true, name: true } },
      reviewer: { select: { name: true } },
      activity: { select: { title: true } },
    },
  })

  if (!review || !review.host.email) return

  const reviewUrl = `${BASE_URL}/host/reviews`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden;">
          <tr>
            <td style="background: linear-gradient(135deg, #FFD230 0%, #F59E0B 100%); padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #171717; font-size: 24px;">
                ${'⭐'.repeat(review.rating)} New ${review.rating}-Star Review!
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 16px 0; color: #525252; font-size: 16px;">
                Hi ${review.host.name || 'there'},
              </p>
              <p style="margin: 0 0 16px 0; color: #525252; font-size: 16px; line-height: 1.5;">
                <strong>${review.reviewer.name || 'Someone'}</strong> just reviewed <strong>${review.activity.title}</strong>!
              </p>
              ${review.content ? `
              <div style="background: #F8FAFF; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; color: #525252; font-size: 15px; font-style: italic;">
                  "${review.content}"
                </p>
              </div>
              ` : ''}
              <a href="${reviewUrl}" style="display: block; background: #10b981; color: #FFFFFF; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 12px; font-size: 15px; font-weight: 600;">
                View & Respond
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  await sendEmail({
    to: review.host.email,
    subject: `New ${review.rating}-star review for ${review.activity.title}!`,
    html,
  })
}

async function notifyReviewerOfResponse(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: {
      reviewer: { select: { email: true, name: true } },
      host: { select: { name: true } },
      activity: { select: { id: true, title: true } },
      hostResponse: true,
    },
  })

  if (!review || !review.hostResponse || !review.reviewer.email) return

  const activityUrl = `${BASE_URL}/activities/${review.activity.id}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Host Response</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" style="padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; padding: 24px;">
          <tr>
            <td>
              <h1 style="margin: 0 0 16px 0; color: #171717; font-size: 20px; text-align: center;">
                ${review.host.name || 'The host'} responded to your review!
              </h1>
              <div style="background: #F8FAFF; border-radius: 12px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; color: #525252; font-size: 15px;">
                  "${review.hostResponse.content}"
                </p>
              </div>
              <a href="${activityUrl}" style="display: block; background: #10b981; color: #FFFFFF; text-decoration: none; text-align: center; padding: 12px 24px; border-radius: 12px; font-size: 15px; font-weight: 600;">
                View Activity
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  await sendEmail({
    to: review.reviewer.email,
    subject: `${review.host.name || 'Host'} responded to your review`,
    html,
  })
}

function buildReviewPromptEmailHtml(params: {
  userName: string
  activityTitle: string
  activityImage: string | null
  hostName: string
  reviewUrl: string
}): string {
  const { userName, activityTitle, activityImage, hostName, reviewUrl } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>How was your experience?</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F8FAFF; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);">

          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: #171717; font-size: 24px; font-weight: 700;">
                How was ${activityTitle}?
              </h1>
            </td>
          </tr>

          ${activityImage ? `
          <tr>
            <td style="padding: 0 24px;">
              <img src="${activityImage}" alt="" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px;">
            </td>
          </tr>
          ` : ''}

          <tr>
            <td style="padding: 24px;">
              <p style="margin: 0 0 20px 0; color: #525252; font-size: 16px; line-height: 1.5; text-align: center;">
                Hi ${userName},<br><br>
                We hope you had a great time with ${hostName}! Your review helps other SweatBuddies find amazing activities.
              </p>

              <div style="text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 12px 0; color: #737373; font-size: 14px;">Tap a star to rate:</p>
                <a href="${reviewUrl}?rating=1" style="text-decoration: none; font-size: 28px; margin: 0 2px;">⭐</a>
                <a href="${reviewUrl}?rating=2" style="text-decoration: none; font-size: 28px; margin: 0 2px;">⭐</a>
                <a href="${reviewUrl}?rating=3" style="text-decoration: none; font-size: 28px; margin: 0 2px;">⭐</a>
                <a href="${reviewUrl}?rating=4" style="text-decoration: none; font-size: 28px; margin: 0 2px;">⭐</a>
                <a href="${reviewUrl}?rating=5" style="text-decoration: none; font-size: 28px; margin: 0 2px;">⭐</a>
              </div>

              <a href="${reviewUrl}" style="display: block; background: #10b981; color: #FFFFFF; text-decoration: none; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 600; margin: 24px 0;">
                Write a Review
              </a>

              <p style="margin: 0; color: #A3A3A3; font-size: 13px; text-align: center;">
                It only takes a minute!
              </p>
            </td>
          </tr>

          <tr>
            <td style="background: #F5F5F5; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #737373; font-size: 12px;">
                SweatBuddies - Find your sweat tribe
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
