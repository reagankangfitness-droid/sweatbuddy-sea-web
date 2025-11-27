import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { aggregateSingleHostStats } from '@/lib/stats/aggregation'

export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hostId = userId

    // Try to get existing stats from denormalized table
    let stats = await prisma.hostStats.findUnique({
      where: { hostId },
    })

    // If no stats exist, try to aggregate them
    if (!stats) {
      // Check if this user has any activities
      const hasActivities = await prisma.activity.findFirst({
        where: { userId: hostId, deletedAt: null },
      })

      if (hasActivities) {
        // Aggregate stats for this host
        await aggregateSingleHostStats(hostId)
        stats = await prisma.hostStats.findUnique({
          where: { hostId },
        })
      }
    }

    // If still no stats, return zeros
    if (!stats) {
      return NextResponse.json({
        success: true,
        stats: {
          totalEvents: 0,
          eventsThisMonth: 0,
          eventsThisYear: 0,
          upcomingEvents: 0,
          completedEvents: 0,
          cancelledEvents: 0,
          totalBookings: 0,
          bookingsThisMonth: 0,
          totalUniqueAttendees: 0,
          uniqueAttendeesThisMonth: 0,
          averageAttendanceRate: 0,
          averageAttendeesPerEvent: 0,
          repeatAttendees: 0,
          repeatAttendeeRate: 0,
          totalRevenue: 0,
          revenueThisMonth: 0,
          revenueThisYear: 0,
          averageRevenuePerEvent: 0,
          totalActivityViews: 0,
          conversionRate: 0,
          lastUpdated: null,
        },
        trends: { monthly: [] },
        topActivities: [],
        recentAttendees: [],
        topAttendees: [],
      })
    }

    // Get monthly trend data (last 6 months)
    const monthlyTrend = await prisma.hostStatsMonthly.findMany({
      where: { hostId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 6,
    })

    // Get top performing activities
    const topActivities = await prisma.activityStats.findMany({
      where: { hostId },
      orderBy: { fillRate: 'desc' },
      take: 5,
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        },
      },
    })

    // Get recent attendees
    const recentAttendees = await prisma.attendeeHistory.findMany({
      where: { hostId },
      orderBy: { lastEventDate: 'desc' },
      take: 10,
      include: {
        attendee: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    // Get top repeat attendees
    const topAttendees = await prisma.attendeeHistory.findMany({
      where: {
        hostId,
        totalEventsAttended: { gte: 2 },
      },
      orderBy: { totalEventsAttended: 'desc' },
      take: 5,
      include: {
        attendee: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      stats: {
        // Overview
        totalEvents: stats.totalEvents,
        eventsThisMonth: stats.totalEventsThisMonth,
        eventsThisYear: stats.totalEventsThisYear,
        upcomingEvents: stats.upcomingEvents,
        completedEvents: stats.completedEvents,
        cancelledEvents: stats.cancelledEvents,

        // Attendees
        totalBookings: stats.totalBookings,
        bookingsThisMonth: stats.totalBookingsThisMonth,
        totalUniqueAttendees: stats.totalUniqueAttendees,
        uniqueAttendeesThisMonth: stats.totalUniqueAttendeesThisMonth,

        // Performance
        averageAttendanceRate: Number(stats.averageAttendanceRate),
        averageAttendeesPerEvent: Number(stats.averageAttendeesPerEvent),
        repeatAttendees: stats.repeatAttendees,
        repeatAttendeeRate: Number(stats.repeatAttendeeRate),

        // Revenue
        totalRevenue: Number(stats.totalRevenue),
        revenueThisMonth: Number(stats.totalRevenueThisMonth),
        revenueThisYear: Number(stats.totalRevenueThisYear),
        averageRevenuePerEvent: Number(stats.averageRevenuePerEvent),

        // Engagement
        totalActivityViews: stats.totalActivityViews,
        conversionRate: Number(stats.bookingConversionRate),

        // Meta
        lastUpdated: stats.updatedAt,
      },
      trends: {
        monthly: monthlyTrend.reverse().map((m) => ({
          year: m.year,
          month: m.month,
          eventsHosted: m.eventsHosted,
          totalBookings: m.totalBookings,
          uniqueAttendees: m.uniqueAttendees,
          totalRevenue: Number(m.totalRevenue),
          averageFillRate: Number(m.averageFillRate),
        })),
      },
      topActivities: topActivities.map((a) => ({
        id: a.activity.id,
        title: a.activity.title,
        date: a.activity.startTime,
        fillRate: Number(a.fillRate),
        confirmedBookings: a.confirmedBookings,
        totalRevenue: Number(a.totalRevenue),
        viewCount: a.viewCount,
      })),
      recentAttendees: recentAttendees.map((a) => ({
        id: a.attendee.id,
        name: a.attendee.name,
        imageUrl: a.attendee.imageUrl,
        totalEventsAttended: a.totalEventsAttended,
        lastEventDate: a.lastEventDate,
        totalSpent: Number(a.totalSpent),
      })),
      topAttendees: topAttendees.map((a) => ({
        id: a.attendee.id,
        name: a.attendee.name,
        imageUrl: a.attendee.imageUrl,
        totalEventsAttended: a.totalEventsAttended,
        totalSpent: Number(a.totalSpent),
      })),
    })
  } catch (error) {
    console.error('Host stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
