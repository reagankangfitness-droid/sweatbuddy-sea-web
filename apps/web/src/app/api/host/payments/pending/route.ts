import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Verify organizer session
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('organizer_session')

    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Decode session to get organizer email
    let session: { email: string }
    try {
      session = JSON.parse(atob(sessionCookie.value))
    } catch {
      return NextResponse.json(
        { error: 'Invalid session' },
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
