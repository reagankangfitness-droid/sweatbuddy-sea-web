import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { sendEventCancellationEmail, sendWaitlistSpotAvailableEmail, sendRefundNotificationEmail } from '@/lib/event-confirmation-email'
import { calculateRefund } from '@/lib/refund-policy'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the authenticated user's email
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase()

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found for user' }, { status: 400 })
    }

    const { eventId, email } = await request.json()

    // Validate required fields
    if (!eventId || !email) {
      return NextResponse.json(
        { error: 'Event ID and email are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Verify the email in the request matches the authenticated user's email
    if (normalizedEmail !== userEmail) {
      return NextResponse.json(
        { error: 'You can only cancel your own RSVP' },
        { status: 403 }
      )
    }

    // Find the attendance record
    const attendance = await prisma.eventAttendance.findFirst({
      where: {
        eventId,
        email: normalizedEmail,
      },
    })

    if (!attendance) {
      return NextResponse.json(
        { error: 'No RSVP found for this email and event' },
        { status: 404 }
      )
    }

    // Handle refund for paid attendees
    let refundResult: { refunded: boolean; amount: number; reason: string } | null = null

    if (attendance.paymentStatus === 'paid' && attendance.paymentAmount && attendance.paymentAmount > 0) {
      // Fetch event's refund policy
      const event = await prisma.eventSubmission.findUnique({
        where: { id: eventId },
        select: {
          refundPolicy: true,
          eventDate: true,
          price: true,
          eventName: true,
          currency: true,
        },
      })

      if (event) {
        const refundCalc = calculateRefund(
          { refundPolicy: event.refundPolicy, eventDate: event.eventDate, price: event.price },
          attendance.paymentAmount,
          new Date(),
          false // attendee-initiated cancellation
        )

        if (refundCalc.eligible && attendance.paymentMethod === 'stripe' && attendance.stripePaymentId) {
          try {
            // Process Stripe refund
            await stripe.refunds.create({
              payment_intent: attendance.stripePaymentId,
              amount: refundCalc.percent < 100 ? refundCalc.amount : undefined,
            })

            // Update transaction record
            await prisma.eventTransaction.updateMany({
              where: { attendanceId: attendance.id },
              data: {
                status: refundCalc.percent === 100 ? 'REFUNDED' : 'PARTIAL_REFUND',
                refundAmount: refundCalc.amount,
                refundedAt: new Date(),
                refundReason: 'Attendee cancelled RSVP',
              },
            })

            // Send refund notification
            sendRefundNotificationEmail({
              to: normalizedEmail,
              userName: attendance.name,
              eventName: event.eventName,
              refundAmount: refundCalc.amount,
              currency: event.currency || 'SGD',
              refundType: refundCalc.percent === 100 ? 'full' : 'partial',
              reason: 'You cancelled your RSVP',
            }).catch(err => {
              console.error('Failed to send refund email:', err)
            })

            refundResult = {
              refunded: true,
              amount: refundCalc.amount,
              reason: refundCalc.reason,
            }
          } catch (refundError) {
            console.error('Stripe refund failed:', refundError)
            refundResult = {
              refunded: false,
              amount: 0,
              reason: 'Refund processing failed - please contact support',
            }
          }
        } else if (!refundCalc.eligible) {
          refundResult = {
            refunded: false,
            amount: 0,
            reason: refundCalc.reason,
          }
        }
      }
    }

    // Delete attendance, clean up chat messages, and update capacity in one transaction
    const { event: cancelledEvent, nextInLine } = await prisma.$transaction(async (tx) => {
      // Delete the attendance record
      await tx.eventAttendance.delete({
        where: { id: attendance.id },
      })

      // Also delete any chat messages from this user for this event
      await tx.eventChatMessage.deleteMany({
        where: {
          eventId,
          senderEmail: normalizedEmail,
        },
      })

      // Check if event was full and reset isFull + find waitlist candidate
      const txEvent = await tx.eventSubmission.findUnique({
        where: { id: eventId },
        select: { id: true, eventName: true, isFull: true, maxTickets: true, slug: true },
      })

      let txNextInLine = null

      if (txEvent?.isFull) {
        // Recount attendees after deletion
        const currentCount = await tx.eventAttendance.count({
          where: { eventId },
        })

        // Reset isFull if we're now below capacity
        if (!txEvent.maxTickets || currentCount < txEvent.maxTickets) {
          await tx.eventSubmission.update({
            where: { id: eventId },
            data: { isFull: false },
          })
        }

        // Get next person on waitlist
        txNextInLine = await tx.eventWaitlist.findFirst({
          where: {
            eventId,
            status: 'WAITING',
          },
          orderBy: { position: 'asc' },
        })

        if (txNextInLine) {
          // Update their status to NOTIFIED
          const expiresAt = new Date()
          expiresAt.setHours(expiresAt.getHours() + 24) // 24-hour window

          await tx.eventWaitlist.update({
            where: { id: txNextInLine.id },
            data: {
              status: 'NOTIFIED',
              notifiedAt: new Date(),
              notificationExpires: expiresAt,
            },
          })
        }
      }

      return { event: txEvent, nextInLine: txNextInLine }
    })

    // Send cancellation email (fire and forget — outside transaction)
    sendEventCancellationEmail({
      to: normalizedEmail,
      userName: attendance.name,
      eventName: attendance.eventName,
    }).catch((error) => {
      console.error('Failed to send cancellation email:', error)
    })

    // Send waitlist notification (fire and forget — outside transaction)
    if (nextInLine && cancelledEvent) {
      const eventUrl = `https://www.sweatbuddies.co/e/${cancelledEvent.slug || cancelledEvent.id}`
      sendWaitlistSpotAvailableEmail({
        to: nextInLine.email,
        userName: nextInLine.name,
        eventName: cancelledEvent.eventName,
        eventUrl,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }).catch((error) => {
        console.error('Failed to send waitlist notification:', error)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'RSVP cancelled successfully',
      refund: refundResult,
    })
  } catch (error) {
    console.error('Cancel attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel RSVP' },
      { status: 500 }
    )
  }
}
