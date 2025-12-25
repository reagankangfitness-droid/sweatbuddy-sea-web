import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId } = await params
    const { action } = await request.json()

    if (!['confirm', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Find the attendance record
    const attendance = await prisma.eventAttendance.findUnique({
      where: { id: paymentId },
    })

    if (!attendance) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Find the event to verify ownership
    const event = await prisma.eventSubmission.findUnique({
      where: { id: attendance.eventId },
      select: {
        id: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Verify host owns this event
    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow verification of pending payments
    if (attendance.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Payment is not pending verification' },
        { status: 400 }
      )
    }

    // Update payment status
    const updatedAttendance = await prisma.eventAttendance.update({
      where: { id: paymentId },
      data: {
        paymentStatus: action === 'confirm' ? 'paid' : 'failed',
        verifiedBy: session.instagramHandle,
        verifiedAt: new Date(),
        paidAt: action === 'confirm' ? new Date() : null,
      },
    })

    console.log('Payment verified:', {
      paymentId,
      action,
      verifiedBy: session.instagramHandle,
      email: attendance.email,
    })

    // TODO: Send email to attendee about confirmation/rejection

    return NextResponse.json({
      success: true,
      paymentStatus: updatedAttendance.paymentStatus,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
