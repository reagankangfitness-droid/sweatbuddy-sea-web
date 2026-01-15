import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrganizerSession } from '@/lib/organizer-session'
import eventsData from '@/data/events.json'

// Get organizer's events
export async function GET() {
  try {
    const session = await getOrganizerSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const instagramHandle = session.instagramHandle

    // Find events where organizer matches (from static data and submissions)
    const staticEvents = eventsData.events.filter(
      (e) => e.organizer.toLowerCase() === instagramHandle.toLowerCase()
    )

    // Find all submissions by this organizer (pending, approved, rejected)
    const submissions = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          equals: instagramHandle,
          mode: 'insensitive',
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get attendance counts for all events
    const eventIds = [
      ...staticEvents.map((e) => e.id),
      ...submissions.map((s) => s.id),
    ]

    const attendanceCounts = await prisma.eventAttendance.groupBy({
      by: ['eventId'],
      where: { eventId: { in: eventIds } },
      _count: { id: true },
    })

    const countMap = new Map(
      attendanceCounts.map((a) => [a.eventId, a._count.id])
    )

    // Get this week's signups count
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const weeklySignups = await prisma.eventAttendance.count({
      where: {
        eventId: { in: eventIds },
        timestamp: { gte: oneWeekAgo },
      },
    })

    // Get recent activity (last 10 signups)
    const recentActivity = await prisma.eventAttendance.findMany({
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

    // Calculate total earnings from paid events
    const paidAttendances = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentAmount: { gt: 0 },
      },
      select: {
        paymentAmount: true,
      },
    })

    const totalEarnings = paidAttendances.reduce(
      (sum, a) => sum + (a.paymentAmount || 0),
      0
    )

    // Format response
    const events = [
      ...staticEvents.map((e) => ({
        id: e.id,
        name: e.name,
        category: e.category,
        day: e.day,
        time: e.time,
        location: e.location,
        description: e.description || null,
        imageUrl: e.imageUrl || null,
        recurring: e.recurring,
        attendeeCount: countMap.get(e.id) || 0,
        source: 'static' as const,
        status: 'approved' as const, // Static events are always live
        isFree: true,
        price: null,
      })),
      ...submissions.map((s) => ({
        id: s.id,
        name: s.eventName,
        category: s.category,
        day: s.day,
        eventDate: s.eventDate?.toISOString() || null,
        time: s.time,
        location: s.location,
        description: s.description || null,
        imageUrl: s.imageUrl || null,
        recurring: s.recurring,
        attendeeCount: countMap.get(s.id) || 0,
        source: 'submission' as const,
        status: s.status.toLowerCase() as 'pending' | 'approved' | 'rejected',
        rejectionReason: s.rejectionReason || null,
        createdAt: s.createdAt.toISOString(),
        isFree: s.isFree,
        price: s.price,
        maxTickets: s.maxTickets,
        ticketsSold: s.ticketsSold,
      })),
    ]

    return NextResponse.json({
      success: true,
      events,
      stats: {
        weeklySignups,
        totalEarnings,
      },
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        eventId: a.eventId,
        eventName: a.eventName,
        attendeeName: a.name || a.email.split('@')[0],
        timestamp: a.timestamp.toISOString(),
        isPaid: a.paymentStatus === 'paid' && (a.paymentAmount || 0) > 0,
        amount: a.paymentAmount || 0,
      })),
    })
  } catch (error) {
    console.error('Get organizer events error:', error)
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    )
  }
}
