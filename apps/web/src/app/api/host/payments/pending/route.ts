import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getHostSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify host session using secure auth
    const session = await getHostSession()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all events for this organizer
    const organizerEvents = await prisma.eventSubmission.findMany({
      where: {
        contactEmail: session.email,
        status: 'APPROVED',
        isFree: false,
      },
      select: {
        id: true,
        eventName: true,
      },
    })

    if (organizerEvents.length === 0) {
      return NextResponse.json({ payments: [] })
    }

    const eventIds = organizerEvents.map(e => e.id)
    const eventMap = new Map(organizerEvents.map(e => [e.id, e.eventName]))

    // Get all payments for these events (pending, paid, and recently failed)
    const payments = await prisma.eventAttendance.findMany({
      where: {
        eventId: { in: eventIds },
        paymentMethod: 'paynow',
        paymentStatus: { in: ['pending', 'paid', 'failed'] },
      },
      orderBy: [
        { paymentStatus: 'asc' }, // pending first
        { timestamp: 'desc' },
      ],
      take: 100, // Limit to recent payments
    })

    const formattedPayments = payments.map(p => ({
      id: p.id,
      eventId: p.eventId,
      eventName: eventMap.get(p.eventId) || p.eventName,
      email: p.email,
      name: p.name,
      amount: p.paymentAmount || 0,
      paymentReference: p.paymentReference || '',
      paymentStatus: p.paymentStatus || 'pending',
      createdAt: p.timestamp.toISOString(),
    }))

    return NextResponse.json({ payments: formattedPayments })
  } catch (error) {
    console.error('Error fetching pending payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}
