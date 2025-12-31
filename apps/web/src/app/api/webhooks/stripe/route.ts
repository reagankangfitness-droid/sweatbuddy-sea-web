import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe, fromStripeAmount } from '@/lib/stripe'
import { onBookingConfirmed, onBookingPaid, onBookingCancelled } from '@/lib/stats/realtime'
import { sendPaidEventConfirmationEmail, sendHostBookingNotificationEmail } from '@/lib/event-confirmation-email'

// Disable body parsing - Stripe requires raw body for signature verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Webhook error: No stripe-signature header')
    return NextResponse.json(
      { error: 'No stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('Webhook error: STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge)
        break

      // Stripe Connect events
      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as Stripe.Application)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle successful checkout
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const sessionId = session.id
  const paymentIntentId = session.payment_intent as string | null
  const metadata = session.metadata || {}
  const amountTotal = session.amount_total || 0
  const currency = session.currency?.toUpperCase() || 'SGD'

  // Check if this is an EventSubmission payment (public events)
  if (metadata.eventId) {
    await handleEventSubmissionPayment(session)
    return
  }

  // Otherwise, handle Activity payment (internal bookings)
  const {
    activity_id: activityId,
    user_id: userId,
    host_id: hostId,
    invite_code: inviteCode,
    referral_invite_id: referralInviteId,
    original_price: originalPrice,
    discount_amount: discountAmount,
    service_fee: serviceFee,
    attendee_pays: attendeePays,
    host_receives: hostReceives,
  } = metadata

  if (!activityId || !userId) {
    console.error('Missing metadata in checkout session:', sessionId)
    return
  }

  console.log(`Processing checkout completion for session ${sessionId}`)

  try {
    // Use transaction to ensure all updates succeed together
    await prisma.$transaction(async (tx) => {
      // 1. Find and update the booking (UserActivity)
      const booking = await tx.userActivity.findFirst({
        where: {
          stripeCheckoutSessionId: sessionId,
        },
      })

      if (!booking) {
        console.error('Booking not found for session:', sessionId)
        throw new Error('Booking not found')
      }

      // 2. Update booking to confirmed
      await tx.userActivity.update({
        where: { id: booking.id },
        data: {
          status: 'JOINED',
          paymentStatus: 'PAID',
          stripePaymentIntentId: paymentIntentId,
          amountPaid: fromStripeAmount(amountTotal, currency),
          currency: currency,
          paidAt: new Date(),
        },
      })

      // 3. Create payment record for audit trail
      // Note: amount is total paid by attendee, serviceFee is platform fee, hostReceives is net to host
      await tx.payment.create({
        data: {
          userActivityId: booking.id,
          userId: userId,
          activityId: activityId,
          hostId: hostId || null,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: paymentIntentId,
          amount: fromStripeAmount(amountTotal, currency),
          currency: currency,
          status: 'PAID',
          originalAmount: originalPrice ? parseFloat(originalPrice) : null,
          discountAmount: discountAmount ? parseFloat(discountAmount) : null,
          discountCode: inviteCode || null,
          referralInviteId: referralInviteId || null,
          platformFee: serviceFee ? parseFloat(serviceFee) : null,
          hostPayout: hostReceives ? parseFloat(hostReceives) : null,
          paidAt: new Date(),
        },
      })

      // 4. Handle referral conversion
      if (referralInviteId) {
        await tx.referralInvite.update({
          where: { id: referralInviteId },
          data: {
            status: 'CONVERTED',
            convertedAt: new Date(),
            friendDiscountApplied: true,
          },
        })

        await tx.referralConversion.create({
          data: {
            inviteId: referralInviteId,
            friendUserId: userId,
            userActivityId: booking.id,
            discountType: 'PERCENTAGE',
            discountValue: 50,
            discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
          },
        })
      }

      // 5. Add user to activity group chat
      const activityGroup = await tx.group.findFirst({
        where: { activityId: activityId },
      })

      if (activityGroup) {
        await tx.userGroup.upsert({
          where: {
            userId_groupId: {
              userId: userId,
              groupId: activityGroup.id,
            },
          },
          update: {
            deletedAt: null,
          },
          create: {
            userId: userId,
            groupId: activityGroup.id,
            role: 'MEMBER',
          },
        })
      }
    })

    console.log(`✅ Booking confirmed for session ${sessionId}`)

    // Update real-time stats (async, don't block)
    try {
      const bookingData = await prisma.userActivity.findFirst({
        where: { stripeCheckoutSessionId: sessionId },
      })
      const activityData = await prisma.activity.findUnique({
        where: { id: activityId },
      })

      if (bookingData && activityData) {
        // Update stats for booking confirmation and payment
        await onBookingConfirmed(bookingData, activityData)
        if (amountTotal > 0) {
          await onBookingPaid(
            bookingData,
            activityData,
            fromStripeAmount(amountTotal, currency)
          )
        }
      }
    } catch (statsError) {
      console.error('Error updating stats (non-blocking):', statsError)
    }

    // TODO: Send confirmation email to user
    // TODO: Send notification to host
  } catch (error) {
    console.error('Error handling checkout completion:', error)
    throw error
  }
}

// Handle expired checkout session
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const sessionId = session.id

  console.log(`Checkout expired for session ${sessionId}`)

  try {
    await prisma.userActivity.updateMany({
      where: {
        stripeCheckoutSessionId: sessionId,
        status: 'INTERESTED', // Only update pending bookings
        paymentStatus: 'PENDING',
      },
      data: {
        paymentStatus: 'EXPIRED',
      },
    })

    console.log(`⏰ Checkout marked as expired for session ${sessionId}`)
  } catch (error) {
    console.error('Error handling checkout expiry:', error)
  }
}

// Handle successful payment (backup handler)
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`💰 Payment succeeded: ${paymentIntent.id}`)
  // This is a backup - checkout.session.completed should handle most cases
}

// Handle failed payment
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id
  const errorMessage = paymentIntent.last_payment_error?.message

  console.log(`❌ Payment failed: ${paymentIntentId}`, errorMessage)

  try {
    await prisma.userActivity.updateMany({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
      data: {
        paymentStatus: 'FAILED',
      },
    })
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

// Handle Stripe Connect account updates
async function handleAccountUpdated(account: Stripe.Account) {
  const accountId = account.id
  const chargesEnabled = account.charges_enabled
  const payoutsEnabled = account.payouts_enabled
  const detailsSubmitted = account.details_submitted

  console.log(`🔄 Account updated: ${accountId}`, {
    chargesEnabled,
    payoutsEnabled,
    detailsSubmitted,
  })

  try {
    // Update our database with the latest account status
    await prisma.hostStripeAccount.updateMany({
      where: { stripeConnectAccountId: accountId },
      data: {
        chargesEnabled,
        payoutsEnabled,
        stripeOnboardingComplete: chargesEnabled && payoutsEnabled && detailsSubmitted,
        email: account.email || undefined,
        updatedAt: new Date(),
      },
    })

    console.log(`✅ Account ${accountId} updated in database`)
  } catch (error) {
    console.error('Error updating account in database:', error)
  }
}

// Handle Stripe Connect account deauthorization
async function handleAccountDeauthorized(application: Stripe.Application) {
  console.log(`⚠️ Application deauthorized:`, application.id)
  // The connected account has disconnected from your platform
  // You might want to notify the host or update their account status
}

// Handle EventSubmission payment (public events with Stripe Connect)
async function handleEventSubmissionPayment(session: Stripe.Checkout.Session) {
  const sessionId = session.id
  const paymentIntentId = session.payment_intent as string | null
  const metadata = session.metadata || {}
  const amountTotal = session.amount_total || 0
  const currency = session.currency?.toUpperCase() || 'SGD'

  const {
    eventId,
    attendeeEmail,
    attendeeName,
    quantity,
    ticketPrice,
    platformFee,
    feeHandling,
  } = metadata

  if (!eventId || !attendeeEmail) {
    console.error('[EventSubmission] Missing metadata in checkout session:', sessionId)
    return
  }

  // Idempotency check - prevent duplicate processing if webhook is retried
  if (paymentIntentId) {
    const existingTransaction = await prisma.eventTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    })
    if (existingTransaction) {
      console.log(`[EventSubmission] Payment already processed for intent ${paymentIntentId}, skipping`)
      return
    }
  }

  console.log(`[EventSubmission] Processing payment for event ${eventId}, session ${sessionId}`)

  try {
    const emailData = await prisma.$transaction(async (tx) => {
      // 1. Get the event
      const event = await tx.eventSubmission.findUnique({
        where: { id: eventId },
      })

      if (!event) {
        console.error('[EventSubmission] Event not found:', eventId)
        throw new Error('Event not found')
      }

      // 2. Get the host's Stripe account
      const hostStripeAccount = await tx.hostStripeAccount.findUnique({
        where: { eventSubmissionId: eventId },
      })

      const ticketQty = parseInt(quantity || '1', 10)
      const ticketPriceNum = parseInt(ticketPrice || '0', 10)
      const platformFeeNum = parseInt(platformFee || '0', 10)

      // 3. Create or update EventAttendance record
      const existingAttendance = await tx.eventAttendance.findFirst({
        where: {
          eventId,
          email: attendeeEmail,
        },
      })

      let attendance
      if (existingAttendance) {
        // Update existing attendance
        attendance = await tx.eventAttendance.update({
          where: { id: existingAttendance.id },
          data: {
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paymentAmount: amountTotal,
            stripePaymentId: paymentIntentId,
            paidAt: new Date(),
          },
        })
      } else {
        // Create new attendance
        attendance = await tx.eventAttendance.create({
          data: {
            eventId,
            eventName: event.eventName,
            name: attendeeName || attendeeEmail.split('@')[0],
            email: attendeeEmail,
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            paymentAmount: amountTotal,
            stripePaymentId: paymentIntentId,
            paidAt: new Date(),
          },
        })
      }

      // 4. Create EventTransaction record for audit trail
      if (hostStripeAccount) {
        // Calculate Stripe fee (approximately 2.9% + $0.30)
        const stripeFeeEstimate = Math.round(amountTotal * 0.029) + 30
        const netPayoutToHost = amountTotal - platformFeeNum - stripeFeeEstimate
        const feeHandlingValue = feeHandling === 'PASS' ? 'PASS' : 'ABSORB'

        await tx.eventTransaction.create({
          data: {
            eventSubmissionId: eventId,
            attendanceId: attendance.id,
            hostStripeAccountId: hostStripeAccount.id,
            stripePaymentIntentId: paymentIntentId,
            ticketPrice: ticketPriceNum,
            platformFee: platformFeeNum,
            stripeFee: stripeFeeEstimate,
            netPayoutToHost,
            totalCharged: amountTotal,
            currency,
            feeHandling: feeHandlingValue,
            status: 'SUCCEEDED',
          },
        })
      }

      // 5. Update ticketsSold count
      await tx.eventSubmission.update({
        where: { id: eventId },
        data: {
          ticketsSold: {
            increment: ticketQty,
          },
        },
      })

      console.log(`[EventSubmission] ✅ Payment processed for ${attendeeEmail} - Event: ${event.eventName}`)

      // Send confirmation emails (async, don't block transaction)
      const emailData = {
        eventId,
        eventName: event.eventName,
        eventDay: event.day || 'TBD',
        eventTime: event.time || 'TBD',
        eventLocation: event.location,
        organizerInstagram: event.organizerInstagram,
        communityLink: event.communityLink,
        attendeeName: attendeeName || attendeeEmail.split('@')[0],
        attendeeEmail,
        amountPaid: amountTotal,
        currency,
        ticketQuantity: ticketQty,
        stripePaymentId: paymentIntentId,
        hostEmail: event.contactEmail,
        netPayoutToHost: hostStripeAccount ? amountTotal - platformFeeNum - (Math.round(amountTotal * 0.029) + 30) : 0,
      }

      // Store for use outside transaction
      return emailData
    })

    // Send confirmation email to attendee
    try {
      const attendeeEmailResult = await sendPaidEventConfirmationEmail({
        to: metadata.attendeeEmail!,
        attendeeName: metadata.attendeeName || metadata.attendeeEmail!.split('@')[0],
        eventId,
        eventName: emailData.eventName,
        eventDay: emailData.eventDay,
        eventTime: emailData.eventTime,
        eventLocation: emailData.eventLocation,
        organizerInstagram: emailData.organizerInstagram,
        communityLink: emailData.communityLink,
        amountPaid: emailData.amountPaid,
        currency: emailData.currency,
        ticketQuantity: emailData.ticketQuantity,
        stripePaymentId: emailData.stripePaymentId,
      })

      if (attendeeEmailResult.success) {
        console.log(`[EventSubmission] ✅ Confirmation email sent to ${metadata.attendeeEmail}`)
      } else {
        console.error(`[EventSubmission] Failed to send confirmation email:`, attendeeEmailResult.error)
      }
    } catch (emailError) {
      console.error('[EventSubmission] Error sending confirmation email:', emailError)
    }

    // Notify host of new booking
    if (emailData.hostEmail) {
      try {
        const hostEmailResult = await sendHostBookingNotificationEmail({
          to: emailData.hostEmail,
          hostName: emailData.organizerInstagram || 'Host',
          eventId,
          eventName: emailData.eventName,
          attendeeName: emailData.attendeeName,
          attendeeEmail: emailData.attendeeEmail,
          amountPaid: emailData.amountPaid,
          currency: emailData.currency,
          ticketQuantity: emailData.ticketQuantity,
          hostPayout: emailData.netPayoutToHost,
        })

        if (hostEmailResult.success) {
          console.log(`[EventSubmission] ✅ Host notification sent to ${emailData.hostEmail}`)
        } else {
          console.error(`[EventSubmission] Failed to send host notification:`, hostEmailResult.error)
        }
      } catch (emailError) {
        console.error('[EventSubmission] Error sending host notification:', emailError)
      }
    }
  } catch (error) {
    console.error('[EventSubmission] Error handling payment:', error)
    throw error
  }
}

// Handle refunds
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string | null
  const amountRefunded = charge.amount_refunded
  const currency = charge.currency.toUpperCase()

  if (!paymentIntentId) {
    console.log('Refund without payment intent ID')
    return
  }

  console.log(`💸 Processing refund for payment intent: ${paymentIntentId}`)

  try {
    // First, check if this is an EventSubmission refund
    const eventTransaction = await prisma.eventTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    })

    if (eventTransaction) {
      await handleEventSubmissionRefund(paymentIntentId, amountRefunded, currency)
      return
    }

    // Otherwise, check for Activity booking refund
    const booking = await prisma.userActivity.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { activity: true },
    })

    if (!booking) {
      console.error('Booking not found for refund:', paymentIntentId)
      return
    }

    const refundAmount = fromStripeAmount(amountRefunded, currency)
    const isFullRefund = amountRefunded >= (charge.amount || 0)

    // Update booking
    await prisma.userActivity.update({
      where: { id: booking.id },
      data: {
        status: isFullRefund ? 'CANCELLED' : booking.status,
        paymentStatus: 'REFUNDED',
        refundAmount: refundAmount,
        refundedAt: new Date(),
      },
    })

    // Update payment record
    await prisma.payment.updateMany({
      where: { stripePaymentIntentId: paymentIntentId },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
      },
    })

    // If full refund, remove user from group chat
    if (isFullRefund) {
      const activityGroup = await prisma.group.findFirst({
        where: { activityId: booking.activityId },
      })

      if (activityGroup) {
        await prisma.userGroup.updateMany({
          where: {
            userId: booking.userId,
            groupId: activityGroup.id,
          },
          data: {
            deletedAt: new Date(),
          },
        })
      }
    }

    console.log(`💸 Refund processed: ${paymentIntentId} - Amount: ${refundAmount} ${currency}`)

    // Update real-time stats for cancellation (async, don't block)
    try {
      if (booking && booking.activity) {
        await onBookingCancelled(
          booking,
          booking.activity,
          refundAmount
        )
      }
    } catch (statsError) {
      console.error('Error updating stats for refund (non-blocking):', statsError)
    }
  } catch (error) {
    console.error('Error handling refund:', error)
  }
}

// Handle refund for EventSubmission payments
async function handleEventSubmissionRefund(
  paymentIntentId: string,
  amountRefunded: number,
  currency: string
) {
  console.log(`[EventSubmission] Processing refund for payment intent: ${paymentIntentId}`)

  try {
    // Find the transaction
    const transaction = await prisma.eventTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
    })

    if (!transaction) {
      console.error('[EventSubmission] Transaction not found for refund:', paymentIntentId)
      return
    }

    // Update transaction record
    await prisma.eventTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'REFUNDED',
        refundedAt: new Date(),
        refundAmount: amountRefunded,
      },
    })

    // Update attendance record
    if (transaction.attendanceId) {
      await prisma.eventAttendance.update({
        where: { id: transaction.attendanceId },
        data: {
          paymentStatus: 'refunded',
        },
      })
    }

    // Decrement ticketsSold
    if (transaction.eventSubmissionId) {
      await prisma.eventSubmission.update({
        where: { id: transaction.eventSubmissionId },
        data: {
          ticketsSold: {
            decrement: 1,
          },
        },
      })
    }

    console.log(`[EventSubmission] 💸 Refund processed: ${paymentIntentId} - Amount: ${amountRefunded / 100} ${currency}`)

    // TODO: Send refund notification email to attendee
  } catch (error) {
    console.error('[EventSubmission] Error handling refund:', error)
  }
}
