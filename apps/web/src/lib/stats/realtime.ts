/**
 * Real-time Stats Update Functions
 *
 * These functions are called immediately when events occur to provide
 * real-time stats updates. Complex calculations are handled by the
 * scheduled aggregation service.
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'
import type { Activity, UserActivity } from '@prisma/client'

/**
 * Initialize or ensure host stats record exists
 */
async function ensureHostStatsExists(hostId: string): Promise<void> {
  await prisma.hostStats.upsert({
    where: { hostId },
    create: { hostId },
    update: {},
  })
}

/**
 * Initialize or ensure activity stats record exists
 */
async function ensureActivityStatsExists(
  activityId: string,
  hostId: string,
  maxPeople: number | null
): Promise<void> {
  await prisma.activityStats.upsert({
    where: { activityId },
    create: {
      activityId,
      hostId,
      totalSpots: maxPeople || 0,
      spotsRemaining: maxPeople || 0,
    },
    update: {},
  })
}

/**
 * Update stats when a booking is confirmed (user joins activity)
 */
export async function onBookingConfirmed(
  booking: UserActivity,
  activity: Activity
): Promise<void> {
  const hostId = activity.userId

  try {
    await prisma.$transaction(async (tx) => {
      // Ensure stats records exist
      await tx.hostStats.upsert({
        where: { hostId },
        create: { hostId },
        update: {},
      })

      await tx.activityStats.upsert({
        where: { activityId: activity.id },
        create: {
          activityId: activity.id,
          hostId,
          totalSpots: activity.maxPeople || 0,
          spotsRemaining: Math.max(0, (activity.maxPeople || 0) - 1),
        },
        update: {},
      })

      // Update host stats - increment booking counts
      await tx.hostStats.update({
        where: { hostId },
        data: {
          totalBookings: { increment: 1 },
          totalBookingsThisMonth: { increment: 1 },
          totalSpotsFilled: { increment: 1 },
        },
      })

      // Check if this is a first-time attendee for this host
      const previousBookings = await tx.userActivity.count({
        where: {
          activity: {
            userId: hostId,
            deletedAt: null,
          },
          userId: booking.userId,
          status: 'JOINED',
          deletedAt: null,
          NOT: { id: booking.id },
        },
      })

      if (previousBookings === 0) {
        // New unique attendee
        await tx.hostStats.update({
          where: { hostId },
          data: {
            totalUniqueAttendees: { increment: 1 },
            totalUniqueAttendeesThisMonth: { increment: 1 },
          },
        })
      } else if (previousBookings === 1) {
        // Just became a repeat attendee (this is their 2nd booking)
        await tx.hostStats.update({
          where: { hostId },
          data: {
            repeatAttendees: { increment: 1 },
          },
        })
      }

      // Update activity stats
      await tx.activityStats.update({
        where: { activityId: activity.id },
        data: {
          totalBookings: { increment: 1 },
          confirmedBookings: { increment: 1 },
          spotsFilled: { increment: 1 },
          spotsRemaining: { decrement: 1 },
        },
      })

      // Update attendee history
      await tx.attendeeHistory.upsert({
        where: {
          hostId_attendeeId: {
            hostId,
            attendeeId: booking.userId,
          },
        },
        create: {
          hostId,
          attendeeId: booking.userId,
          totalEventsAttended: 1,
          firstEventDate: new Date(),
          lastEventDate: new Date(),
          totalSpent: new Decimal(booking.amountPaid || 0),
        },
        update: {
          totalEventsAttended: { increment: 1 },
          lastEventDate: new Date(),
          totalSpent: { increment: booking.amountPaid || 0 },
        },
      })
    })

    // Stats updated successfully
  } catch {
    // Don't throw - stats updates should not block the main flow
  }
}

/**
 * Update stats when a booking is paid
 */
export async function onBookingPaid(
  booking: UserActivity,
  activity: Activity,
  amount: number
): Promise<void> {
  const hostId = activity.userId

  try {
    await ensureHostStatsExists(hostId)

    await prisma.hostStats.update({
      where: { hostId },
      data: {
        totalRevenue: { increment: amount },
        totalRevenueThisMonth: { increment: amount },
        totalRevenueThisYear: { increment: amount },
      },
    })

    await prisma.activityStats.updateMany({
      where: { activityId: activity.id },
      data: {
        totalRevenue: { increment: amount },
      },
    })

    // Update attendee history with payment
    await prisma.attendeeHistory.updateMany({
      where: {
        hostId,
        attendeeId: booking.userId,
      },
      data: {
        totalSpent: { increment: amount },
      },
    })

    // Revenue stats updated successfully
  } catch {
    // Error handled silently
  }
}

/**
 * Update stats when a booking is cancelled
 */
export async function onBookingCancelled(
  booking: UserActivity,
  activity: Activity,
  refundAmount?: number
): Promise<void> {
  const hostId = activity.userId

  try {
    await prisma.$transaction(async (tx) => {
      // Decrement booking counts
      await tx.hostStats.updateMany({
        where: { hostId },
        data: {
          totalBookings: { decrement: 1 },
          totalSpotsFilled: { decrement: 1 },
        },
      })

      // Check remaining bookings for this attendee with this host
      const remainingBookings = await tx.userActivity.count({
        where: {
          activity: {
            userId: hostId,
            deletedAt: null,
          },
          userId: booking.userId,
          status: 'JOINED',
          deletedAt: null,
        },
      })

      if (remainingBookings === 0) {
        // Was their only booking - decrement unique attendees
        await tx.hostStats.updateMany({
          where: { hostId },
          data: {
            totalUniqueAttendees: { decrement: 1 },
          },
        })
      } else if (remainingBookings === 1) {
        // Was a repeat attendee, now single - decrement repeat
        await tx.hostStats.updateMany({
          where: { hostId },
          data: {
            repeatAttendees: { decrement: 1 },
          },
        })
      }

      // Update activity stats
      await tx.activityStats.updateMany({
        where: { activityId: activity.id },
        data: {
          cancelledBookings: { increment: 1 },
          confirmedBookings: { decrement: 1 },
          spotsFilled: { decrement: 1 },
          spotsRemaining: { increment: 1 },
        },
      })

      // Update attendee history
      await tx.attendeeHistory.updateMany({
        where: {
          hostId,
          attendeeId: booking.userId,
        },
        data: {
          totalEventsAttended: { decrement: 1 },
        },
      })

      // Handle refund revenue adjustment
      if (refundAmount && refundAmount > 0) {
        await tx.hostStats.updateMany({
          where: { hostId },
          data: {
            totalRevenue: { decrement: refundAmount },
          },
        })

        await tx.activityStats.updateMany({
          where: { activityId: activity.id },
          data: {
            totalRevenue: { decrement: refundAmount },
          },
        })

        await tx.attendeeHistory.updateMany({
          where: {
            hostId,
            attendeeId: booking.userId,
          },
          data: {
            totalSpent: { decrement: refundAmount },
          },
        })
      }
    })

    // Stats updated for cancellation
  } catch {
    // Error handled silently
  }
}

/**
 * Track activity view
 */
export async function trackActivityView(
  activityId: string,
  viewerId?: string | null,
  source?: string | null,
  deviceType?: string | null
): Promise<void> {
  try {
    // Get activity to find host
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      select: { userId: true },
    })

    if (!activity) return

    // Insert view record
    await prisma.activityView.create({
      data: {
        activityId,
        viewerId,
        source,
        deviceType,
      },
    })

    // Ensure stats exist
    await ensureActivityStatsExists(activityId, activity.userId, null)
    await ensureHostStatsExists(activity.userId)

    // Increment activity view count
    await prisma.activityStats.update({
      where: { activityId },
      data: {
        viewCount: { increment: 1 },
      },
    })

    // Update host total activity views
    await prisma.hostStats.update({
      where: { hostId: activity.userId },
      data: {
        totalActivityViews: { increment: 1 },
      },
    })

    // Increment unique viewers only if logged in user hasn't viewed before
    if (viewerId) {
      const previousView = await prisma.activityView.findFirst({
        where: {
          activityId,
          viewerId,
          id: { not: undefined }, // Exclude the view we just created
        },
        orderBy: { viewedAt: 'desc' },
        skip: 1, // Skip the one we just created
      })

      if (!previousView) {
        await prisma.activityStats.update({
          where: { activityId },
          data: {
            uniqueViewers: { increment: 1 },
          },
        })
      }
    }
  } catch {
    // Error handled silently
  }
}

/**
 * Update stats when activity is created
 */
export async function onActivityCreated(activity: Activity): Promise<void> {
  const hostId = activity.userId
  const isUpcoming = activity.startTime && new Date(activity.startTime) >= new Date()

  try {
    // Ensure host stats record exists and update
    await prisma.hostStats.upsert({
      where: { hostId },
      create: {
        hostId,
        totalEvents: 1,
        totalEventsThisMonth: 1,
        totalEventsThisYear: 1,
        upcomingEvents: isUpcoming ? 1 : 0,
        totalSpotsOffered: activity.maxPeople || 0,
      },
      update: {
        totalEvents: { increment: 1 },
        totalEventsThisMonth: { increment: 1 },
        totalEventsThisYear: { increment: 1 },
        upcomingEvents: isUpcoming ? { increment: 1 } : undefined,
        totalSpotsOffered: { increment: activity.maxPeople || 0 },
      },
    })

    // Create activity stats record
    await prisma.activityStats.create({
      data: {
        activityId: activity.id,
        hostId,
        totalSpots: activity.maxPeople || 0,
        spotsRemaining: activity.maxPeople || 0,
      },
    })

    // Stats initialized for activity
  } catch {
    // Error handled silently
  }
}

/**
 * Update stats when activity is cancelled
 */
export async function onActivityCancelled(activity: Activity): Promise<void> {
  const hostId = activity.userId

  try {
    await ensureHostStatsExists(hostId)

    const isUpcoming = activity.startTime && new Date(activity.startTime) >= new Date()

    await prisma.hostStats.update({
      where: { hostId },
      data: {
        cancelledEvents: { increment: 1 },
        upcomingEvents: isUpcoming ? { decrement: 1 } : undefined,
      },
    })

    // Stats updated for cancelled activity
  } catch {
    // Error handled silently
  }
}

/**
 * Update stats when activity is completed (past its start time)
 */
export async function onActivityCompleted(activity: Activity): Promise<void> {
  const hostId = activity.userId

  try {
    await ensureHostStatsExists(hostId)

    await prisma.hostStats.update({
      where: { hostId },
      data: {
        completedEvents: { increment: 1 },
        upcomingEvents: { decrement: 1 },
      },
    })

    // Stats updated for completed activity
  } catch {
    // Error handled silently
  }
}

/**
 * Recalculate fill rate for an activity
 * Call this after booking changes
 */
export async function recalculateActivityFillRate(activityId: string): Promise<void> {
  try {
    const stats = await prisma.activityStats.findUnique({
      where: { activityId },
    })

    if (!stats || stats.totalSpots === 0) return

    const fillRate = Math.round(
      (stats.spotsFilled / stats.totalSpots) * 10000
    ) / 100

    const viewToBookingRate =
      stats.viewCount > 0
        ? Math.round((stats.confirmedBookings / stats.viewCount) * 10000) / 100
        : 0

    await prisma.activityStats.update({
      where: { activityId },
      data: {
        fillRate: new Decimal(fillRate),
        viewToBookingRate: new Decimal(viewToBookingRate),
      },
    })
  } catch {
    // Error handled silently
  }
}

/**
 * Recalculate attendance and repeat rates for a host
 * Call this periodically or after significant changes
 */
export async function recalculateHostRates(hostId: string): Promise<void> {
  try {
    const stats = await prisma.hostStats.findUnique({
      where: { hostId },
    })

    if (!stats) return

    // Calculate attendance rate
    const attendanceRate =
      stats.totalSpotsOffered > 0
        ? Math.round(
            (stats.totalSpotsFilled / stats.totalSpotsOffered) * 10000
          ) / 100
        : 0

    // Calculate average attendees per event
    const avgAttendeesPerEvent =
      stats.totalEvents > 0
        ? Math.round((stats.totalSpotsFilled / stats.totalEvents) * 100) / 100
        : 0

    // Calculate repeat attendee rate
    const repeatRate =
      stats.totalUniqueAttendees > 0
        ? Math.round(
            (stats.repeatAttendees / stats.totalUniqueAttendees) * 10000
          ) / 100
        : 0

    // Calculate average revenue per event
    const avgRevenue =
      stats.totalEvents > 0
        ? Math.round(
            (Number(stats.totalRevenue) / stats.totalEvents) * 100
          ) / 100
        : 0

    // Calculate conversion rate
    const conversionRate =
      stats.totalActivityViews > 0
        ? Math.round(
            (stats.totalBookings / stats.totalActivityViews) * 10000
          ) / 100
        : 0

    await prisma.hostStats.update({
      where: { hostId },
      data: {
        averageAttendanceRate: new Decimal(attendanceRate),
        averageAttendeesPerEvent: new Decimal(avgAttendeesPerEvent),
        repeatAttendeeRate: new Decimal(repeatRate),
        averageRevenuePerEvent: new Decimal(avgRevenue),
        bookingConversionRate: new Decimal(conversionRate),
      },
    })
  } catch {
    // Error handled silently
  }
}
