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

    // Get all approved events for this host
    const events = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          equals: instagramHandle,
          mode: 'insensitive',
        },
        status: 'APPROVED',
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
        price: true,
        ticketsSold: true,
        maxTickets: true,
        isFree: true,
      },
    })

    const eventIds = events.map(e => e.id)

    // Get Stripe account status
    const stripeAccount = await prisma.hostStripeAccount.findFirst({
      where: {
        eventSubmissionId: { in: eventIds },
      },
      select: {
        stripeConnectAccountId: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        stripeOnboardingComplete: true,
      },
    })

    // Get all transactions for this host's events
    const transactions = await prisma.eventTransaction.findMany({
      where: {
        eventSubmissionId: { in: eventIds },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate summary totals
    const completedTransactions = transactions.filter(t => t.status === 'SUCCEEDED')
    const refundedTransactions = transactions.filter(t => t.status === 'REFUNDED')

    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.totalCharged, 0)
    const totalPlatformFees = completedTransactions.reduce((sum, t) => sum + t.platformFee, 0)
    const totalStripeFees = completedTransactions.reduce((sum, t) => sum + t.stripeFee, 0)
    const totalHostEarnings = completedTransactions.reduce((sum, t) => sum + t.netPayoutToHost, 0)
    const totalRefunded = refundedTransactions.reduce((sum, t) => sum + (t.refundAmount || t.totalCharged), 0)

    // Get earnings grouped by event
    const earningsByEvent = eventIds.map(eventId => {
      const event = events.find(e => e.id === eventId)
      const eventTransactions = completedTransactions.filter(t => t.eventSubmissionId === eventId)

      return {
        eventId,
        eventName: event?.eventName || 'Unknown Event',
        eventDate: event?.eventDate?.toISOString() || null,
        ticketPrice: event?.price || 0,
        ticketsSold: event?.ticketsSold || 0,
        ticketLimit: event?.maxTickets || null,
        isFree: event?.isFree || false,
        totalRevenue: eventTransactions.reduce((sum, t) => sum + t.totalCharged, 0),
        platformFees: eventTransactions.reduce((sum, t) => sum + t.platformFee, 0),
        stripeFees: eventTransactions.reduce((sum, t) => sum + t.stripeFee, 0),
        hostEarnings: eventTransactions.reduce((sum, t) => sum + t.netPayoutToHost, 0),
        transactionCount: eventTransactions.length,
      }
    }).filter(e => !e.isFree && e.transactionCount > 0) // Only show paid events with transactions

    // Get recent activity (last 10 transactions)
    const recentActivity = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        paymentStatus: 'paid',
        paymentMethod: 'stripe',
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
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

    return NextResponse.json({
      host: {
        instagramHandle,
        stripeConnected: !!stripeAccount?.stripeConnectAccountId,
        stripeChargesEnabled: stripeAccount?.chargesEnabled || false,
        stripePayoutsEnabled: stripeAccount?.payoutsEnabled || false,
      },
      summary: {
        totalRevenue,
        totalPlatformFees,
        totalStripeFees,
        totalHostEarnings,
        totalRefunded,
        transactionCount: completedTransactions.length,
        currency: 'SGD',
      },
      eventEarnings: earningsByEvent.sort((a, b) => {
        const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0
        const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0
        return dateB - dateA
      }),
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        eventName: a.eventName,
        attendeeEmail: a.email,
        attendeeName: a.name,
        amount: a.paymentAmount || 0,
        date: a.paidAt?.toISOString() || null,
      })),
      transactions: transactions.map(t => {
        const event = events.find(e => e.id === t.eventSubmissionId)
        return {
          id: t.id,
          eventId: t.eventSubmissionId,
          eventName: event?.eventName || 'Unknown',
          amount: t.totalCharged,
          platformFee: t.platformFee,
          stripeFee: t.stripeFee,
          hostPayout: t.netPayoutToHost,
          status: t.status,
          date: t.createdAt.toISOString(),
          refundedAt: t.refundedAt?.toISOString() || null,
          refundAmount: t.refundAmount,
        }
      }),
    })
  } catch (error) {
    console.error('Earnings API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}
