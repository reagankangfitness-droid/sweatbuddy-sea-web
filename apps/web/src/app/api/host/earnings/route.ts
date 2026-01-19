import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const instagramHandle = session.instagramHandle
    const userId = session.userId

    // Build base where clause: prioritize userId for account-based queries
    const baseWhereClause = userId
      ? {
          OR: [
            { submittedByUserId: userId },
            { organizerInstagram: { equals: instagramHandle, mode: 'insensitive' as const } },
          ],
        }
      : {
          organizerInstagram: { equals: instagramHandle, mode: 'insensitive' as const },
        }

    // Get all approved paid events for this host
    const events = await prisma.eventSubmission.findMany({
      where: {
        ...baseWhereClause,
        status: 'APPROVED',
        isFree: false,
        price: { gt: 0 },
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        price: true,
        ticketsSold: true,
        maxTickets: true,
      },
    })

    const eventIds = events.map(e => e.id)

    // Get all PayNow payments for this host's events
    const paidAttendances = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentMethod: 'paynow',
      },
      orderBy: { paidAt: 'desc' },
      select: {
        id: true,
        eventId: true,
        eventName: true,
        email: true,
        name: true,
        paymentAmount: true,
        paidAt: true,
      },
    })

    // Calculate totals
    const totalRevenue = paidAttendances.reduce((sum, a) => sum + (a.paymentAmount || 0), 0)
    const totalRefunded = 0 // PayNow refunds handled manually outside the system

    // Get earnings grouped by event
    const eventEarnings = events.map(event => {
      const eventPayments = paidAttendances.filter(a => a.eventId === event.id)
      const eventRevenue = eventPayments.reduce((sum, a) => sum + (a.paymentAmount || 0), 0)

      return {
        eventId: event.id,
        eventName: event.eventName,
        eventDate: event.eventDate?.toISOString() || null,
        ticketPrice: event.price || 0,
        ticketsSold: eventPayments.length,
        ticketLimit: event.maxTickets || null,
        totalRevenue: eventRevenue,
        transactionCount: eventPayments.length,
      }
    }).filter(e => e.transactionCount > 0) // Only show events with payments

    // Recent activity (last 10 payments)
    const recentActivity = paidAttendances.slice(0, 10).map(a => ({
      id: a.id,
      eventName: a.eventName,
      attendeeEmail: a.email,
      attendeeName: a.name,
      amount: a.paymentAmount || 0,
      date: a.paidAt?.toISOString() || null,
    }))

    // All transactions
    const transactions = paidAttendances.map(a => ({
      id: a.id,
      eventId: a.eventId,
      eventName: a.eventName,
      amount: a.paymentAmount || 0,
      status: 'SUCCEEDED',
      date: a.paidAt?.toISOString() || new Date().toISOString(),
      refundedAt: null,
      refundAmount: null,
    }))

    return NextResponse.json({
      host: {
        instagramHandle,
      },
      summary: {
        totalRevenue,
        totalRefunded,
        transactionCount: paidAttendances.length,
        currency: 'SGD',
      },
      eventEarnings: eventEarnings.sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0
        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0
        return dateB - dateA
      }),
      recentActivity,
      transactions,
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
