import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { sendP2PSessionConfirmationEmail, sendP2PHostJoinNotificationEmail } from '@/lib/event-confirmation-email'
import { notify } from '@/lib/notifications/service'
import { getCurrentDbUser } from '@/lib/current-user'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import { calculateFees } from '@/lib/constants/fees'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

async function countReservedSpots(tx: Prisma.TransactionClient, activityId: string): Promise<number> {
  return tx.userActivity.count({
    where: {
      activityId,
      deletedAt: null,
      OR: [
        { status: { in: ['JOINED', 'COMPLETED'] } },
        { status: 'INTERESTED', p2pPaymentStatus: 'PENDING' },
      ],
    },
  })
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const dbUser = await getCurrentDbUser()
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId } = await params

    let paymentMethod: string | null = null
    let paymentProofUrl: string | null = null
    let amountPaid: number | null = null
    let requestDepositAmount: number | null = null
    try {
      const body = await req.json().catch(() => ({}))
      paymentMethod = body.paymentMethod ?? null
      paymentProofUrl = body.paymentProofUrl ?? null
      amountPaid = body.amountPaid ?? null
      requestDepositAmount = body.depositAmount ?? null
    } catch {
      // No body is fine for free sessions.
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      include: {
        userActivities: {
          where: {
            OR: [
              { status: { in: ['JOINED', 'COMPLETED'] } },
              { status: 'INTERESTED', p2pPaymentStatus: 'PENDING' },
            ],
          },
        },
        user: { select: { id: true, name: true, email: true, bio: true, p2pStripeConnectId: true } },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (!['P2P_FREE', 'P2P_PAID'].includes(activity.activityMode)) {
      return NextResponse.json({ error: 'Not a P2P session' }, { status: 400 })
    }
    if (activity.status !== 'PUBLISHED') {
      return NextResponse.json({ error: 'Session is not available' }, { status: 400 })
    }
    if (activity.startTime && activity.startTime < new Date()) {
      return NextResponse.json({ error: 'Session has already started' }, { status: 400 })
    }

    const existingRsvp = await prisma.userActivity.findUnique({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
    })
    if (existingRsvp?.status === 'JOINED' || existingRsvp?.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Already joined this session' }, { status: 400 })
    }
    if (existingRsvp?.status === 'INTERESTED' && existingRsvp.p2pPaymentStatus === 'PENDING') {
      return NextResponse.json({ error: 'Payment is already pending for this session' }, { status: 400 })
    }

    const isHost = activity.userId === dbUser.id

    if (activity.activityMode === 'P2P_PAID') {
      if (!paymentMethod) {
        return NextResponse.json(
          {
            error: 'Payment required',
            code: 'PAYMENT_REQUIRED',
            session: {
              id: activity.id,
              title: activity.title,
              price: activity.price,
              currency: activity.currency,
              acceptPayNow: activity.acceptPayNow,
              acceptStripe: activity.acceptStripe,
              paynowQrImageUrl: activity.paynowQrImageUrl,
              paynowName: activity.paynowName,
              paynowPhoneNumber: activity.paynowPhoneNumber,
            },
          },
          { status: 402 },
        )
      }

      if (!['PAYNOW', 'STRIPE'].includes(paymentMethod)) {
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
      }

      if (paymentMethod === 'STRIPE') {
        if (!activity.acceptStripe) {
          return NextResponse.json({ error: 'Stripe is not enabled for this session' }, { status: 400 })
        }
        if (!activity.user.p2pStripeConnectId) {
          return NextResponse.json({ error: 'Host has not connected Stripe' }, { status: 400 })
        }

        const currency = activity.currency || 'SGD'
        const fees = calculateFees(activity.price / 100, 1)
        const serviceFeeCents = Math.round(fees.serviceFee * 100)
        const attendeePaysCents = Math.round(fees.attendeePays * 100)
        const hostReceivesCents = Math.round(fees.hostReceives * 100)

        const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          customer_email: dbUser.email,
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: activity.title,
                  description: activity.address || activity.city,
                  images: activity.imageUrl ? [activity.imageUrl] : [],
                },
                unit_amount: activity.price,
              },
              quantity: 1,
            },
            ...(serviceFeeCents > 0
              ? [{
                  price_data: {
                    currency: currency.toLowerCase(),
                    product_data: {
                      name: 'Service fee',
                      description: 'Platform and payment processing fee',
                    },
                    unit_amount: serviceFeeCents,
                  },
                  quantity: 1,
                }]
              : []),
          ],
          payment_intent_data: {
            application_fee_amount: serviceFeeCents,
            transfer_data: {
              destination: activity.user.p2pStripeConnectId,
            },
          },
          metadata: {
            flow: 'p2p_session',
            activity_id: activityId,
            user_id: dbUser.id,
            host_id: activity.userId,
            original_price: activity.price.toString(),
            discount_amount: '0',
            service_fee: serviceFeeCents.toString(),
            attendee_pays: attendeePaysCents.toString(),
            host_receives: hostReceivesCents.toString(),
            currency,
          },
          success_url: `${BASE_URL}/activities/${activityId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${BASE_URL}/activities/${activityId}?payment=cancelled`,
          expires_at: Math.floor(Date.now() / 1000) + STRIPE_CONFIG.SESSION_EXPIRES_IN_SECONDS,
        })

        const userActivity = await prisma.$transaction(async (tx) => {
          const reservedCount = await countReservedSpots(tx, activityId)
          if (activity.maxPeople && reservedCount >= activity.maxPeople) {
            throw new Error('SESSION_FULL')
          }

          return tx.userActivity.upsert({
            where: { userId_activityId: { userId: dbUser.id, activityId } },
            create: {
              userId: dbUser.id,
              activityId,
              status: 'INTERESTED',
              p2pPaymentStatus: 'PENDING',
              p2pPaymentMethod: 'STRIPE',
              stripeCheckoutSessionId: checkoutSession.id,
              amountPaid: attendeePaysCents,
              currency,
              paymentStatus: 'PENDING',
            },
            update: {
              status: 'INTERESTED',
              p2pPaymentStatus: 'PENDING',
              p2pPaymentMethod: 'STRIPE',
              stripeCheckoutSessionId: checkoutSession.id,
              amountPaid: attendeePaysCents,
              currency,
              paymentStatus: 'PENDING',
              paidAt: null,
              deletedAt: null,
            },
          })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

        return NextResponse.json({
          userActivity,
          paymentStatus: 'PENDING',
          checkoutUrl: checkoutSession.url,
          sessionId: checkoutSession.id,
        })
      }

      if (!activity.acceptPayNow) {
        return NextResponse.json({ error: 'PayNow is not enabled for this session' }, { status: 400 })
      }
      if (!paymentProofUrl) {
        return NextResponse.json({ error: 'Payment proof is required for PayNow' }, { status: 400 })
      }

      const userActivity = await prisma.$transaction(async (tx) => {
        const reservedCount = await countReservedSpots(tx, activityId)
        if (activity.maxPeople && reservedCount >= activity.maxPeople) {
          throw new Error('SESSION_FULL')
        }

        return tx.userActivity.upsert({
          where: { userId_activityId: { userId: dbUser.id, activityId } },
          create: {
            userId: dbUser.id,
            activityId,
            status: 'INTERESTED',
            p2pPaymentStatus: 'PENDING',
            p2pPaymentMethod: 'PAYNOW',
            paymentProofUrl,
            paymentProofUploadedAt: new Date(),
            amountPaid: amountPaid ?? activity.price,
            paymentStatus: 'PENDING',
          },
          update: {
            status: 'INTERESTED',
            p2pPaymentStatus: 'PENDING',
            p2pPaymentMethod: 'PAYNOW',
            paymentProofUrl,
            paymentProofUploadedAt: new Date(),
            amountPaid: amountPaid ?? activity.price,
            paymentStatus: 'PENDING',
            deletedAt: null,
          },
        })
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

      return NextResponse.json({ userActivity, paymentStatus: 'PENDING' })
    }

    const hasDeposit = activity.requiresDeposit === true
    const depositAmount = hasDeposit
      ? (requestDepositAmount ?? activity.depositAmount ?? 500)
      : null
    const depositData = hasDeposit
      ? { depositAmount, depositStatus: 'HELD' as const }
      : {}

    const { userActivity, shouldIncrementAttendance } = await prisma.$transaction(async (tx) => {
      const joinedCount = await tx.userActivity.count({
        where: {
          activityId,
          deletedAt: null,
          status: { in: ['JOINED', 'COMPLETED'] },
        },
      })
      if (activity.maxPeople && joinedCount >= activity.maxPeople) {
        throw new Error('SESSION_FULL')
      }

      const before = await tx.userActivity.findUnique({
        where: { userId_activityId: { userId: dbUser.id, activityId } },
      })
      const userActivity = await tx.userActivity.upsert({
        where: { userId_activityId: { userId: dbUser.id, activityId } },
        create: { userId: dbUser.id, activityId, status: 'JOINED', p2pPaymentStatus: 'VERIFIED', ...depositData },
        update: { status: 'JOINED', p2pPaymentStatus: 'VERIFIED', deletedAt: null, ...depositData },
      })
      const shouldIncrementAttendance = before?.status !== 'JOINED' && before?.status !== 'COMPLETED'
      if (shouldIncrementAttendance) {
        await tx.user.update({
          where: { id: dbUser.id },
          data: { sessionsAttendedCount: { increment: 1 } },
        })
      }
      return { userActivity, shouldIncrementAttendance }
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

    const newAttendeeCount = activity.userActivities.length + (shouldIncrementAttendance ? 1 : 0)

    sendP2PSessionConfirmationEmail({
      to: dbUser.email,
      attendeeName: dbUser.name,
      activityId,
      activityTitle: activity.title,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.address ?? activity.city,
      hostName: activity.user.name,
      hostBio: activity.user.bio,
      isFree: true,
    }).catch(() => {})

    if (!isHost) {
      notify({
        userId: activity.userId,
        type: 'ACTIVITY_UPDATE',
        title: `${dbUser.name ?? 'Someone'} joined your session`,
        body: `${activity.title} - ${newAttendeeCount} going${activity.maxPeople ? ` / ${activity.maxPeople} spots` : ''}`,
        linkUrl: `/activities/${activityId}`,
      }).catch(() => {})

      if (activity.maxPeople && newAttendeeCount >= activity.maxPeople * 0.8) {
        notify({
          userId: activity.userId,
          type: 'ACTIVITY_UPDATE',
          title: 'Your session is almost full!',
          body: `${activity.title} - only ${activity.maxPeople - newAttendeeCount} spot${activity.maxPeople - newAttendeeCount === 1 ? '' : 's'} left`,
          linkUrl: `/activities/${activityId}`,
        }).catch(() => {})
      }
    }

    if (activity.user.email && !isHost) {
      sendP2PHostJoinNotificationEmail({
        to: activity.user.email,
        hostName: activity.user.name,
        attendeeName: dbUser.name,
        activityId,
        activityTitle: activity.title,
        startTime: activity.startTime,
        location: activity.address ?? activity.city,
        totalAttendees: newAttendeeCount,
        maxPeople: activity.maxPeople,
      }).catch(() => {})
    }

    return NextResponse.json({ userActivity })
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_FULL') {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }
    console.error('[buddy/sessions/join] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
