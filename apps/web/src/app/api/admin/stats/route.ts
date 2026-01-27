import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'
import { startOfDay, subDays, eachDayOfInterval, format } from 'date-fns'

export async function GET(request: Request) {
  // Admin auth check
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const weekAgo = startOfDay(subDays(new Date(), 7))

    // Get all stats in parallel for efficiency
    const [
      totalAttendees,
      attendeesThisWeek,
      totalSubscribers,
      subscribersThisWeek,
      totalEvents,
      pendingEvents,
      totalMessages,
      messagesThisWeek,
      activeConversations,
      optInCount,
      recentAttendees,
      recentSubscribers,
    ] = await Promise.all([
      // Total attendees count
      prisma.eventAttendance.count(),

      // Attendees this week
      prisma.eventAttendance.count({
        where: { timestamp: { gte: weekAgo } },
      }),

      // Total newsletter subscribers
      prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),

      // Subscribers this week
      prisma.newsletterSubscriber.count({
        where: {
          subscribedAt: { gte: weekAgo },
          isActive: true,
        },
      }),

      // Total approved events
      prisma.eventSubmission.count({
        where: { status: 'APPROVED' },
      }),

      // Pending events
      prisma.eventSubmission.count({
        where: { status: 'PENDING' },
      }),

      // Total direct messages
      prisma.eventDirectMessage.count(),

      // Messages this week
      prisma.eventDirectMessage.count({
        where: { createdAt: { gte: weekAgo } },
      }),

      // Active conversations (with messages in last 7 days)
      prisma.eventDirectConversation.count({
        where: { lastMessageAt: { gte: weekAgo } },
      }),

      // Opt-in count for rate calculation
      prisma.eventAttendance.count({
        where: { subscribe: true },
      }),

      // Recent attendees (last 10)
      prisma.eventAttendance.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          id: true,
          eventId: true,
          eventName: true,
          email: true,
          name: true,
          subscribe: true,
          timestamp: true,
          confirmed: true,
        },
      }),

      // Recent subscribers (last 10)
      prisma.newsletterSubscriber.findMany({
        where: { isActive: true },
        orderBy: { subscribedAt: 'desc' },
        take: 10,
        select: {
          email: true,
          name: true,
          subscribedAt: true,
          source: true,
        },
      }),
    ])

    // Calculate opt-in rate
    const optInRate = totalAttendees > 0
      ? Math.round((optInCount / totalAttendees) * 100)
      : 0

    // Get unique events with RSVPs
    const eventsWithRsvps = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
    })

    // Generate chart data for last 7 days
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    })

    const chartData = await Promise.all(
      days.map(async (day) => {
        const dayStart = startOfDay(day)
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

        const [dayAttendees, daySubscribers] = await Promise.all([
          prisma.eventAttendance.count({
            where: {
              timestamp: { gte: dayStart, lt: dayEnd },
            },
          }),
          prisma.newsletterSubscriber.count({
            where: {
              subscribedAt: { gte: dayStart, lt: dayEnd },
              isActive: true,
            },
          }),
        ])

        return {
          date: format(day, 'EEE'),
          attendees: dayAttendees,
          subscribers: daySubscribers,
        }
      })
    )

    // Get top events by RSVPs
    const eventRsvpCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId', 'eventName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const topEvents = eventRsvpCounts.map(e => ({
      name: e.eventName.length > 15 ? e.eventName.slice(0, 15) + '...' : e.eventName,
      value: e._count.id,
    }))

    // Get subscriber source distribution
    const sourceCounts = await prisma.newsletterSubscriber.groupBy({
      by: ['source'],
      _count: { id: true },
      where: { isActive: true },
    })

    const sourceData = sourceCounts.map(s => ({
      name: (s.source || 'unknown').replace('_', ' '),
      value: s._count.id,
    }))

    return NextResponse.json({
      stats: {
        totalAttendees,
        attendeesThisWeek,
        totalSubscribers,
        subscribersThisWeek,
        totalEvents,
        pendingEvents,
        eventsWithRsvps: eventsWithRsvps.length,
        totalMessages,
        messagesThisWeek,
        activeConversations,
        optInRate,
      },
      chartData,
      topEvents,
      sourceData,
      recentAttendees: recentAttendees.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      })),
      recentSubscribers: recentSubscribers.map(s => ({
        ...s,
        subscribedAt: s.subscribedAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
