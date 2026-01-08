import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PayNowCheckoutRequest {
  eventId: string
  eventName: string
  email: string
  name?: string
  paymentReference?: string
  transactionRef?: string // Alternative field name for backwards compatibility
  amount: number
  // Event details for confirmation
  eventDay?: string
  eventTime?: string
  eventLocation?: string
  organizerInstagram?: string
}

export async function POST(request: Request) {
  try {
    const data: PayNowCheckoutRequest = await request.json()

    // Accept both paymentReference and transactionRef
    const paymentReference = data.paymentReference || data.transactionRef || ''

    // Validate required fields
    if (!data.eventId || !data.email || !paymentReference) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate payment reference (at least 4 characters)
    if (paymentReference.length < 4) {
      return NextResponse.json(
        { error: 'Payment reference must be at least 4 characters' },
        { status: 400 }
      )
    }

    // Verify event exists and is a paid event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: data.eventId },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (event.isFree) {
      return NextResponse.json(
        { error: 'This is not a paid event' },
        { status: 400 }
      )
    }

    if (!event.paynowEnabled) {
      return NextResponse.json(
        { error: 'PayNow is not enabled for this event' },
        { status: 400 }
      )
    }

    // Check for existing pending/paid signup with same email
    const existing = await prisma.eventAttendance.findFirst({
      where: {
        eventId: data.eventId,
        email: data.email.toLowerCase(),
        paymentStatus: { in: ['pending', 'paid'] },
      },
    })

    if (existing) {
      if (existing.paymentStatus === 'paid') {
        return NextResponse.json(
          { error: 'You have already registered and paid for this event' },
          { status: 400 }
        )
      } else {
        return NextResponse.json(
          { error: 'You already have a pending payment for this event. Please wait for verification.' },
          { status: 400 }
        )
      }
    }

    // Create attendee with pending payment status
    const attendance = await prisma.eventAttendance.create({
      data: {
        eventId: data.eventId,
        eventName: data.eventName || event.eventName,
        email: data.email.toLowerCase(),
        name: data.name || null,
        paymentStatus: 'pending',
        paymentMethod: 'paynow',
        paymentAmount: data.amount || event.price,
        paymentReference: paymentReference.toUpperCase(),
      },
    })

    // Payment submission logged for host verification

    return NextResponse.json({
      success: true,
      message: 'Payment submitted for verification',
      attendanceId: attendance.id,
    })
  } catch (error) {
    console.error('PayNow checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
