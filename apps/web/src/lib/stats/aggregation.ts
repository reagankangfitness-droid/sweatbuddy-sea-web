/**
 * Stats Aggregation Service
 *
 * Handles scheduled aggregation of host and activity statistics.
 * Uses Prisma for database operations.
 */

import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Aggregate host stats from raw data
 */
export async function aggregateHostStats(hostId?: string): Promise<{ processed: number; duration: number }> {
  const startTime = Date.now()

  try {
    // Get hosts to process (those who have activities)
    const hosts = hostId
      ? await prisma.user.findMany({
          where: { id: hostId },
          select: { id: true },
        })
      : await prisma.user.findMany({
          where: {
            activities: {
              some: {
                deletedAt: null,
              },
            },
          },
          select: { id: true },
        })

    let processed = 0

    for (const host of hosts) {
      await aggregateSingleHostStats(host.id)
      processed++
    }

    const duration = Date.now() - startTime

    return { processed, duration }
  } catch (error) {
    throw error
  }
}

/**
 * Aggregate stats for a single host
 */
export async function aggregateSingleHostStats(hostId: string): Promise<void> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  // Get all activities for this host
  const activities = await prisma.activity.findMany({
    where: {
      userId: hostId,
      deletedAt: null,
    },
    include: {
      userActivities: {
        where: {
          status: 'JOINED',
          deletedAt: null,
        },
      },
    },
  })

  // Calculate event counts
  const totalEvents = activities.length
  const eventsThisMonth = activities.filter(
    (a) => a.createdAt >= startOfMonth
  ).length
  const eventsThisYear = activities.filter(
    (a) => a.createdAt >= startOfYear
  ).length
  const upcomingEvents = activities.filter(
    (a) => a.startTime && new Date(a.startTime) >= now && a.status !== 'CANCELLED'
  ).length
  const completedEvents = activities.filter(
    (a) => a.startTime && new Date(a.startTime) < now && a.status !== 'CANCELLED'
  ).length
  const cancelledEvents = activities.filter(
    (a) => a.status === 'CANCELLED'
  ).length

  // Calculate booking counts
  const allBookings = activities.flatMap((a) => a.userActivities)
  const totalBookings = allBookings.length
  const bookingsThisMonth = allBookings.filter(
    (b) => b.createdAt >= startOfMonth
  ).length

  // Calculate unique attendees
  const uniqueAttendeeIds = new Set(allBookings.map((b) => b.userId))
  const totalUniqueAttendees = uniqueAttendeeIds.size

  // Calculate unique attendees this month
  const thisMonthBookings = allBookings.filter((b) => b.createdAt >= startOfMonth)
  const uniqueThisMonth = new Set(thisMonthBookings.map((b) => b.userId)).size

  // Calculate capacity & attendance
  const totalSpotsOffered = activities.reduce(
    (sum, a) => sum + (a.maxPeople || 0),
    0
  )
  const totalSpotsFilled = totalBookings
  const averageAttendanceRate =
    totalSpotsOffered > 0
      ? Math.round((totalSpotsFilled / totalSpotsOffered) * 10000) / 100
      : 0
  const averageAttendeesPerEvent =
    totalEvents > 0
      ? Math.round((totalSpotsFilled / totalEvents) * 100) / 100
      : 0

  // Calculate repeat attendees (attended 2+ events)
  const attendeeCounts = new Map<string, number>()
  for (const booking of allBookings) {
    const count = attendeeCounts.get(booking.userId) || 0
    attendeeCounts.set(booking.userId, count + 1)
  }
  const repeatAttendees = Array.from(attendeeCounts.values()).filter(
    (count) => count >= 2
  ).length
  const repeatAttendeeRate =
    totalUniqueAttendees > 0
      ? Math.round((repeatAttendees / totalUniqueAttendees) * 10000) / 100
      : 0

  // Calculate revenue from paid bookings
  const paidBookings = await prisma.userActivity.findMany({
    where: {
      activity: {
        userId: hostId,
        deletedAt: null,
      },
      paymentStatus: 'PAID',
      deletedAt: null,
    },
    select: {
      amountPaid: true,
      paidAt: true,
    },
  })

  const totalRevenue = paidBookings.reduce(
    (sum, b) => sum + (b.amountPaid || 0),
    0
  )
  const revenueThisMonth = paidBookings
    .filter((b) => b.paidAt && b.paidAt >= startOfMonth)
    .reduce((sum, b) => sum + (b.amountPaid || 0), 0)
  const revenueThisYear = paidBookings
    .filter((b) => b.paidAt && b.paidAt >= startOfYear)
    .reduce((sum, b) => sum + (b.amountPaid || 0), 0)
  const averageRevenuePerEvent =
    totalEvents > 0 ? Math.round((totalRevenue / totalEvents) * 100) / 100 : 0

  // Get activity view stats
  const activityIds = activities.map((a) => a.id)
  const totalActivityViews = await prisma.activityView.count({
    where: {
      activityId: { in: activityIds },
    },
  })

  // Calculate conversion rate
  const bookingConversionRate =
    totalActivityViews > 0
      ? Math.round((totalBookings / totalActivityViews) * 10000) / 100
      : 0

  // Upsert host stats
  await prisma.hostStats.upsert({
    where: { hostId },
    create: {
      hostId,
      totalEvents,
      totalEventsThisMonth: eventsThisMonth,
      totalEventsThisYear: eventsThisYear,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      totalBookings,
      totalBookingsThisMonth: bookingsThisMonth,
      totalUniqueAttendees,
      totalUniqueAttendeesThisMonth: uniqueThisMonth,
      totalSpotsOffered,
      totalSpotsFilled,
      averageAttendanceRate: new Decimal(averageAttendanceRate),
      averageAttendeesPerEvent: new Decimal(averageAttendeesPerEvent),
      repeatAttendees,
      repeatAttendeeRate: new Decimal(repeatAttendeeRate),
      totalRevenue: new Decimal(totalRevenue),
      totalRevenueThisMonth: new Decimal(revenueThisMonth),
      totalRevenueThisYear: new Decimal(revenueThisYear),
      averageRevenuePerEvent: new Decimal(averageRevenuePerEvent),
      totalActivityViews,
      bookingConversionRate: new Decimal(bookingConversionRate),
      lastAggregatedAt: now,
    },
    update: {
      totalEvents,
      totalEventsThisMonth: eventsThisMonth,
      totalEventsThisYear: eventsThisYear,
      upcomingEvents,
      completedEvents,
      cancelledEvents,
      totalBookings,
      totalBookingsThisMonth: bookingsThisMonth,
      totalUniqueAttendees,
      totalUniqueAttendeesThisMonth: uniqueThisMonth,
      totalSpotsOffered,
      totalSpotsFilled,
      averageAttendanceRate: new Decimal(averageAttendanceRate),
      averageAttendeesPerEvent: new Decimal(averageAttendeesPerEvent),
      repeatAttendees,
      repeatAttendeeRate: new Decimal(repeatAttendeeRate),
      totalRevenue: new Decimal(totalRevenue),
      totalRevenueThisMonth: new Decimal(revenueThisMonth),
      totalRevenueThisYear: new Decimal(revenueThisYear),
      averageRevenuePerEvent: new Decimal(averageRevenuePerEvent),
      totalActivityViews,
      bookingConversionRate: new Decimal(bookingConversionRate),
      lastAggregatedAt: now,
    },
  })
}

/**
 * Update attendee history for a host
 */
export async function updateAttendeeHistory(hostId: string): Promise<void> {
  // Get all bookings for this host's activities
  const bookings = await prisma.userActivity.findMany({
    where: {
      activity: {
        userId: hostId,
        deletedAt: null,
      },
      status: 'JOINED',
      deletedAt: null,
    },
    select: {
      userId: true,
      createdAt: true,
      amountPaid: true,
      paymentStatus: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by attendee
  const attendeeData = new Map<
    string,
    {
      count: number
      firstDate: Date
      lastDate: Date
      totalSpent: number
    }
  >()

  for (const booking of bookings) {
    const existing = attendeeData.get(booking.userId)
    const spent =
      booking.paymentStatus === 'PAID' ? booking.amountPaid || 0 : 0

    if (existing) {
      existing.count++
      existing.lastDate = booking.createdAt
      existing.totalSpent += spent
    } else {
      attendeeData.set(booking.userId, {
        count: 1,
        firstDate: booking.createdAt,
        lastDate: booking.createdAt,
        totalSpent: spent,
      })
    }
  }

  // Upsert attendee history records
  for (const [attendeeId, data] of attendeeData) {
    await prisma.attendeeHistory.upsert({
      where: {
        hostId_attendeeId: {
          hostId,
          attendeeId,
        },
      },
      create: {
        hostId,
        attendeeId,
        totalEventsAttended: data.count,
        firstEventDate: data.firstDate,
        lastEventDate: data.lastDate,
        totalSpent: new Decimal(data.totalSpent),
      },
      update: {
        totalEventsAttended: data.count,
        lastEventDate: data.lastDate,
        totalSpent: new Decimal(data.totalSpent),
      },
    })
  }
}

/**
 * Aggregate activity stats
 */
export async function aggregateActivityStats(
  activityId?: string
): Promise<number> {

  const activities = await prisma.activity.findMany({
    where: activityId
      ? { id: activityId, deletedAt: null }
      : { deletedAt: null },
    select: {
      id: true,
      userId: true,
      maxPeople: true,
      price: true,
    },
  })

  for (const activity of activities) {
    // Get booking stats
    const bookingStats = await prisma.userActivity.groupBy({
      by: ['status'],
      where: {
        activityId: activity.id,
        deletedAt: null,
      },
      _count: true,
    })

    const confirmedCount =
      bookingStats.find((s) => s.status === 'JOINED')?._count || 0
    const cancelledCount =
      bookingStats.find((s) => s.status === 'CANCELLED')?._count || 0
    const totalBookings = bookingStats.reduce((sum, s) => sum + s._count, 0)

    // Get view stats
    const viewStats = await prisma.activityView.aggregate({
      where: { activityId: activity.id },
      _count: true,
    })

    const uniqueViewers = await prisma.activityView.groupBy({
      by: ['viewerId'],
      where: {
        activityId: activity.id,
        viewerId: { not: null },
      },
    })

    // Get revenue
    const revenueData = await prisma.userActivity.aggregate({
      where: {
        activityId: activity.id,
        paymentStatus: 'PAID',
        deletedAt: null,
      },
      _sum: {
        amountPaid: true,
      },
    })

    const totalSpots = activity.maxPeople || 0
    const spotsFilled = confirmedCount
    const spotsRemaining = Math.max(0, totalSpots - spotsFilled)
    const fillRate =
      totalSpots > 0
        ? Math.round((spotsFilled / totalSpots) * 10000) / 100
        : 0

    const viewCount = viewStats._count
    const conversionRate =
      viewCount > 0
        ? Math.round((confirmedCount / viewCount) * 10000) / 100
        : 0

    // Upsert activity stats
    await prisma.activityStats.upsert({
      where: { activityId: activity.id },
      create: {
        activityId: activity.id,
        hostId: activity.userId,
        totalSpots,
        spotsFilled,
        spotsRemaining,
        fillRate: new Decimal(fillRate),
        totalBookings,
        confirmedBookings: confirmedCount,
        cancelledBookings: cancelledCount,
        viewCount,
        uniqueViewers: uniqueViewers.length,
        viewToBookingRate: new Decimal(conversionRate),
        totalRevenue: new Decimal(revenueData._sum.amountPaid || 0),
      },
      update: {
        totalSpots,
        spotsFilled,
        spotsRemaining,
        fillRate: new Decimal(fillRate),
        totalBookings,
        confirmedBookings: confirmedCount,
        cancelledBookings: cancelledCount,
        viewCount,
        uniqueViewers: uniqueViewers.length,
        viewToBookingRate: new Decimal(conversionRate),
        totalRevenue: new Decimal(revenueData._sum.amountPaid || 0),
      },
    })
  }

  return activities.length
}

/**
 * Create daily snapshot
 */
export async function createDailySnapshot(date?: Date): Promise<number> {
  const snapshotDate = date || new Date()
  snapshotDate.setHours(0, 0, 0, 0)

  const nextDay = new Date(snapshotDate)
  nextDay.setDate(nextDay.getDate() + 1)

  // Get all hosts with activity on this day
  const hostsWithActivity = await prisma.activity.groupBy({
    by: ['userId'],
    where: {
      OR: [
        {
          startTime: {
            gte: snapshotDate,
            lt: nextDay,
          },
        },
        {
          userActivities: {
            some: {
              createdAt: {
                gte: snapshotDate,
                lt: nextDay,
              },
            },
          },
        },
      ],
      deletedAt: null,
    },
  })

  const hostIds = hostsWithActivity.map((h) => h.userId)

  // Batch all counts in parallel instead of N+1 per host
  const [eventsGrouped, bookingsGrouped, cancellationsGrouped, revenueGrouped, viewsGrouped] =
    await Promise.all([
      prisma.activity.groupBy({
        by: ['userId'],
        where: {
          userId: { in: hostIds },
          startTime: { gte: snapshotDate, lt: nextDay },
          deletedAt: null,
        },
        _count: { id: true },
      }),
      prisma.userActivity.groupBy({
        by: ['activityId'],
        where: {
          activity: { userId: { in: hostIds }, deletedAt: null },
          status: 'JOINED',
          createdAt: { gte: snapshotDate, lt: nextDay },
          deletedAt: null,
        },
        _count: { id: true },
      }),
      prisma.userActivity.groupBy({
        by: ['activityId'],
        where: {
          activity: { userId: { in: hostIds }, deletedAt: null },
          status: 'CANCELLED',
          updatedAt: { gte: snapshotDate, lt: nextDay },
        },
        _count: { id: true },
      }),
      prisma.userActivity.groupBy({
        by: ['activityId'],
        where: {
          activity: { userId: { in: hostIds }, deletedAt: null },
          paymentStatus: 'PAID',
          paidAt: { gte: snapshotDate, lt: nextDay },
          deletedAt: null,
        },
        _sum: { amountPaid: true },
      }),
      prisma.activityView.groupBy({
        by: ['activityId'],
        where: {
          activity: { userId: { in: hostIds }, deletedAt: null },
          viewedAt: { gte: snapshotDate, lt: nextDay },
        },
        _count: { id: true },
      }),
    ])

  // Build lookup maps: hostId -> count
  const eventsMap = new Map(eventsGrouped.map((e) => [e.userId, e._count.id]))

  // For userActivity groupBy results, we need to map activityId back to hostId
  // Fetch activity->host mapping for the relevant activities
  const allActivityIds = [
    ...new Set([
      ...bookingsGrouped.map((b) => b.activityId),
      ...cancellationsGrouped.map((c) => c.activityId),
      ...revenueGrouped.map((r) => r.activityId),
      ...viewsGrouped.map((v) => v.activityId),
    ]),
  ]

  const activityHostMap = new Map<string, string>()
  if (allActivityIds.length > 0) {
    const activities = await prisma.activity.findMany({
      where: { id: { in: allActivityIds } },
      select: { id: true, userId: true },
    })
    activities.forEach((a) => activityHostMap.set(a.id, a.userId))
  }

  // Aggregate per host
  const bookingsMap = new Map<string, number>()
  const cancellationsMap = new Map<string, number>()
  const revenueMap = new Map<string, number>()
  const viewsMap = new Map<string, number>()

  bookingsGrouped.forEach((b) => {
    const hid = activityHostMap.get(b.activityId)
    if (hid) bookingsMap.set(hid, (bookingsMap.get(hid) || 0) + b._count.id)
  })
  cancellationsGrouped.forEach((c) => {
    const hid = activityHostMap.get(c.activityId)
    if (hid) cancellationsMap.set(hid, (cancellationsMap.get(hid) || 0) + c._count.id)
  })
  revenueGrouped.forEach((r) => {
    const hid = activityHostMap.get(r.activityId)
    if (hid) revenueMap.set(hid, (revenueMap.get(hid) || 0) + (r._sum.amountPaid || 0))
  })
  viewsGrouped.forEach((v) => {
    const hid = activityHostMap.get(v.activityId)
    if (hid) viewsMap.set(hid, (viewsMap.get(hid) || 0) + v._count.id)
  })

  // Upsert all snapshots
  for (const hostId of hostIds) {
    await prisma.hostStatsDaily.upsert({
      where: {
        hostId_date: {
          hostId,
          date: snapshotDate,
        },
      },
      create: {
        hostId,
        date: snapshotDate,
        eventsHosted: eventsMap.get(hostId) || 0,
        newBookings: bookingsMap.get(hostId) || 0,
        cancellations: cancellationsMap.get(hostId) || 0,
        revenue: new Decimal(revenueMap.get(hostId) || 0),
        activityViews: viewsMap.get(hostId) || 0,
      },
      update: {
        eventsHosted: eventsMap.get(hostId) || 0,
        newBookings: bookingsMap.get(hostId) || 0,
        cancellations: cancellationsMap.get(hostId) || 0,
        revenue: new Decimal(revenueMap.get(hostId) || 0),
        activityViews: viewsMap.get(hostId) || 0,
      },
    })
  }

  return hostsWithActivity.length
}

/**
 * Create monthly snapshot
 */
export async function createMonthlySnapshot(
  year?: number,
  month?: number
): Promise<number> {
  const now = new Date()
  const targetYear = year || now.getFullYear()
  const targetMonth = month || now.getMonth() + 1

  const startOfMonth = new Date(targetYear, targetMonth - 1, 1)
  const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59)

  // Get all hosts with activity this month
  const hostsWithActivity = await prisma.activity.groupBy({
    by: ['userId'],
    where: {
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      deletedAt: null,
    },
  })

  for (const host of hostsWithActivity) {
    const hostId = host.userId

    // Get activities this month
    const activities = await prisma.activity.findMany({
      where: {
        userId: hostId,
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        deletedAt: null,
      },
      include: {
        userActivities: {
          where: {
            status: 'JOINED',
            deletedAt: null,
          },
        },
      },
    })

    const eventsHosted = activities.length
    const allBookings = activities.flatMap((a) => a.userActivities)
    const totalBookings = allBookings.length
    const uniqueAttendees = new Set(allBookings.map((b) => b.userId)).size

    // Calculate capacity
    const totalSpotsOffered = activities.reduce(
      (sum, a) => sum + (a.maxPeople || 0),
      0
    )
    const totalSpotsFilled = totalBookings
    const averageFillRate =
      totalSpotsOffered > 0
        ? Math.round((totalSpotsFilled / totalSpotsOffered) * 10000) / 100
        : 0

    // Calculate revenue
    const revenueData = await prisma.userActivity.aggregate({
      where: {
        activity: {
          userId: hostId,
          deletedAt: null,
        },
        paymentStatus: 'PAID',
        paidAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        deletedAt: null,
      },
      _sum: {
        amountPaid: true,
      },
    })

    const totalRevenue = revenueData._sum.amountPaid || 0
    const averageRevenuePerEvent =
      eventsHosted > 0 ? Math.round((totalRevenue / eventsHosted) * 100) / 100 : 0

    // Upsert monthly snapshot
    await prisma.hostStatsMonthly.upsert({
      where: {
        hostId_year_month: {
          hostId,
          year: targetYear,
          month: targetMonth,
        },
      },
      create: {
        hostId,
        year: targetYear,
        month: targetMonth,
        eventsHosted,
        totalBookings,
        uniqueAttendees,
        totalSpotsOffered,
        totalSpotsFilled,
        averageFillRate: new Decimal(averageFillRate),
        totalRevenue: new Decimal(totalRevenue),
        averageRevenuePerEvent: new Decimal(averageRevenuePerEvent),
      },
      update: {
        eventsHosted,
        totalBookings,
        uniqueAttendees,
        totalSpotsOffered,
        totalSpotsFilled,
        averageFillRate: new Decimal(averageFillRate),
        totalRevenue: new Decimal(totalRevenue),
        averageRevenuePerEvent: new Decimal(averageRevenuePerEvent),
      },
    })
  }

  return hostsWithActivity.length
}
