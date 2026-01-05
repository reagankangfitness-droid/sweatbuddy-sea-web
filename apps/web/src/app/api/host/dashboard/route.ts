import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface DashboardEvent {
  id: string
  name: string
  day: string
  date: string | null
  time: string
  location: string
  imageUrl: string | null
  category: string
  recurring: boolean
  goingCount: number
  organizer: string
  showUpRate?: number | null
  attendedCount?: number
  status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string | null
  slug?: string | null
}

interface RecentActivity {
  id: string
  eventId: string
  eventName: string
  attendeeName: string | null
  attendeeEmail: string
  timestamp: string
  type: 'rsvp' | 'paid'
  amount?: number | null
}

interface AtRiskMember {
  email: string
  name: string | null
  totalAttendance: number
  lastAttendedDate: string
  daysSinceLastAttended: number
  missedEventCount: number
}

export async function GET() {
  try {
    // Check authentication
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle

    // Get ALL events for this organizer (approved, pending, rejected)
    const allSubmissions = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          equals: instagramHandle,
          mode: 'insensitive',
        },
      },
      orderBy: { eventDate: 'asc' },
      select: {
        id: true,
        eventName: true,
        category: true,
        day: true,
        eventDate: true,
        time: true,
        location: true,
        imageUrl: true,
        recurring: true,
        organizerInstagram: true,
        status: true,
        rejectionReason: true,
        slug: true,
      },
    })

    // Filter approved submissions for stats calculations
    const submissions = allSubmissions.filter(s => s.status === 'APPROVED')

    // Get attendance counts for all events
    const eventIds = submissions.map((s) => s.id)
    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    })

    const countMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Get attendance tracking stats (who actually showed up)
    const attendanceStats = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: {
        eventId: { in: eventIds },
        actuallyAttended: true,
      },
      _count: { id: true },
    })
    const attendedMap = new Map(
      attendanceStats.map((a) => [a.eventId, a._count.id])
    )

    // Split into upcoming and past events
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Map ALL submissions (for tabs display)
    const mapEvent = (s: typeof allSubmissions[0]): DashboardEvent => {
      const goingCount = countMap.get(s.id) || 0
      const attendedCount = attendedMap.get(s.id) || 0
      const showUpRate = goingCount > 0 && attendedCount > 0
        ? Math.round((attendedCount / goingCount) * 100)
        : null

      return {
        id: s.id,
        name: s.eventName,
        day: s.day,
        date: s.eventDate?.toISOString().split('T')[0] || null,
        time: s.time,
        location: s.location,
        imageUrl: s.imageUrl,
        category: s.category,
        recurring: s.recurring,
        goingCount,
        organizer: s.organizerInstagram,
        attendedCount,
        showUpRate,
        status: s.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        rejectionReason: s.rejectionReason,
        slug: s.slug,
      }
    }

    const allEvents: DashboardEvent[] = submissions.map(mapEvent)

    // Pending and rejected events
    const pendingEvents = allSubmissions.filter(s => s.status === 'PENDING').map(mapEvent)
    const rejectedEvents = allSubmissions.filter(s => s.status === 'REJECTED').map(mapEvent)

    // For recurring events without a date, consider them as upcoming
    const upcoming = allEvents.filter((event) => {
      if (!event.date) return true // Recurring events are always upcoming
      return new Date(event.date) >= now
    })

    const past = allEvents
      .filter((event) => {
        if (!event.date) return false // Recurring events are not in past
        return new Date(event.date) < now
      })
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0
        const dateB = b.date ? new Date(b.date).getTime() : 0
        return dateB - dateA // Sort descending (newest first)
      })
      .slice(0, 5) // Limit to 5

    // Calculate stats
    const totalSignups = allEvents.reduce((sum, e) => sum + e.goingCount, 0)

    // Get total Stripe earnings for this organizer's events
    const eventTransactions = await prisma.eventTransaction.findMany({
      where: {
        eventSubmissionId: { in: eventIds },
        status: 'SUCCEEDED',
      },
      select: {
        netPayoutToHost: true,
        totalCharged: true,
        currency: true,
      },
    })

    // Calculate totals (in cents)
    const totalEarnings = eventTransactions.reduce((sum, t) => sum + (t.netPayoutToHost || 0), 0)
    const totalRevenue = eventTransactions.reduce((sum, t) => sum + (t.totalCharged || 0), 0)

    // Get count of paid attendees
    const paidAttendeesCount = await prisma.eventAttendance.count({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
      },
    })

    // Get top regulars (repeat attendees)
    const repeatAttendees = await prisma.eventAttendance.groupBy({
      by: ['email', 'name'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    })

    const topRegulars = repeatAttendees
      .filter(a => a._count.id >= 2) // Only show people who've come 2+ times
      .map(a => ({
        email: a.email,
        name: a.name,
        attendanceCount: a._count.id,
      }))

    // Get recent activity (last 10 signups across all events)
    const recentSignups = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        eventId: true,
        eventName: true,
        name: true,
        email: true,
        timestamp: true,
        paymentStatus: true,
        paymentAmount: true,
      },
    })

    const recentActivity: RecentActivity[] = recentSignups.map(s => ({
      id: s.id,
      eventId: s.eventId,
      eventName: s.eventName,
      attendeeName: s.name,
      attendeeEmail: s.email,
      timestamp: s.timestamp.toISOString(),
      type: s.paymentStatus === 'paid' ? 'paid' : 'rsvp',
      amount: s.paymentAmount,
    }))

    // At-Risk Member Detection
    // Flag members who:
    // 1. Have attended 3+ events with this host (they're regulars)
    // 2. Haven't attended in 30+ days
    // 3. Have missed 2+ events since their last attendance
    const atRiskMembers: AtRiskMember[] = []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Get all past events (events that have already happened)
    const pastEventIds = submissions
      .filter(s => s.eventDate && new Date(s.eventDate) < now)
      .map(s => s.id)

    if (pastEventIds.length > 0) {
      // Get all regulars (3+ attendances)
      const regulars = await prisma.eventAttendance.groupBy({
        by: ['email'],
        where: { eventId: { in: eventIds } },
        _count: { id: true },
        having: { id: { _count: { gte: 3 } } },
      })

      const regularEmails = regulars.map(r => r.email.toLowerCase())

      if (regularEmails.length > 0) {
        // Get last attendance for each regular
        const lastAttendances = await prisma.eventAttendance.findMany({
          where: {
            email: { in: regularEmails, mode: 'insensitive' },
            eventId: { in: pastEventIds },
          },
          orderBy: { timestamp: 'desc' },
          select: {
            email: true,
            name: true,
            timestamp: true,
            eventId: true,
          },
        })

        // Group by email and get most recent attendance
        const lastAttendanceMap = new Map<string, { name: string | null; timestamp: Date; eventId: string }>()
        for (const attendance of lastAttendances) {
          const emailLower = attendance.email.toLowerCase()
          if (!lastAttendanceMap.has(emailLower)) {
            lastAttendanceMap.set(emailLower, {
              name: attendance.name,
              timestamp: attendance.timestamp,
              eventId: attendance.eventId,
            })
          }
        }

        // Count events that happened after each regular's last attendance
        for (const [email, lastAttendance] of lastAttendanceMap) {
          const daysSince = Math.floor(
            (now.getTime() - lastAttendance.timestamp.getTime()) / (1000 * 60 * 60 * 24)
          )

          // Skip if attended within last 30 days
          if (daysSince < 30) continue

          // Count events they missed (events after their last attendance)
          const missedEvents = submissions.filter(s => {
            if (!s.eventDate) return false
            return new Date(s.eventDate) > lastAttendance.timestamp && new Date(s.eventDate) < now
          }).length

          // Only flag if they missed 2+ events
          if (missedEvents >= 2) {
            const totalAttendance = regulars.find(r => r.email.toLowerCase() === email)?._count.id || 0
            atRiskMembers.push({
              email,
              name: lastAttendance.name,
              totalAttendance,
              lastAttendedDate: lastAttendance.timestamp.toISOString().split('T')[0],
              daysSinceLastAttended: daysSince,
              missedEventCount: missedEvents,
            })
          }
        }

        // Sort by most at-risk (most days since last attended)
        atRiskMembers.sort((a, b) => b.daysSinceLastAttended - a.daysSinceLastAttended)
      }
    }

    return NextResponse.json({
      stats: {
        activeEvents: upcoming.length,
        pendingEvents: pendingEvents.length,
        totalSignups,
        totalEarnings,
        totalRevenue,
        paidAttendees: paidAttendeesCount,
        atRiskCount: atRiskMembers.length,
      },
      upcoming,
      past,
      pending: pendingEvents,
      rejected: rejectedEvents,
      recentActivity,
      topRegulars,
      atRiskMembers,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
