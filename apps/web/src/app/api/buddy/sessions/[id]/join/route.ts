import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { sendP2PSessionConfirmationEmail, sendP2PHostJoinNotificationEmail } from '@/lib/event-confirmation-email'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id: activityId } = await params

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse optional payment body for paid sessions
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
    } catch { /* no body is fine for free sessions */ }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      include: {
        userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } },
        user: { select: { id: true, name: true, email: true, bio: true } },
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
    const isHost = activity.userId === dbUser.id
    if (activity.startTime && activity.startTime < new Date()) {
      return NextResponse.json({ error: 'Session has already started' }, { status: 400 })
    }

    // Capacity check
    const activeCount = activity.userActivities.length
    if (activity.maxPeople && activeCount >= activity.maxPeople) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Handle paid sessions
    if (activity.activityMode === 'P2P_PAID') {
      // If no payment method provided, ask client to show payment modal
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
              acceptPayNow: (activity as { acceptPayNow?: boolean }).acceptPayNow ?? false,
              acceptStripe: (activity as { acceptStripe?: boolean }).acceptStripe ?? false,
              paynowQrImageUrl: (activity as { paynowQrImageUrl?: string | null }).paynowQrImageUrl ?? null,
              paynowName: (activity as { paynowName?: string | null }).paynowName ?? null,
              paynowPhoneNumber: (activity as { paynowPhoneNumber?: string | null }).paynowPhoneNumber ?? null,
            },
          },
          { status: 402 }
        )
      }

      // Validate payment method
      if (!['PAYNOW', 'STRIPE'].includes(paymentMethod)) {
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
      }

      // PayNow requires proof
      if (paymentMethod === 'PAYNOW' && !paymentProofUrl) {
        return NextResponse.json({ error: 'Payment proof is required for PayNow' }, { status: 400 })
      }

      const p2pPaymentStatus = paymentMethod === 'STRIPE' ? 'VERIFIED' : 'PENDING'
      const joinStatus = paymentMethod === 'STRIPE' ? 'JOINED' : 'INTERESTED' // PAYNOW pending approval

      const userActivity = await prisma.userActivity.upsert({
        where: { userId_activityId: { userId: dbUser.id, activityId } },
        create: {
          userId: dbUser.id,
          activityId,
          status: joinStatus,
          p2pPaymentStatus,
          p2pPaymentMethod: paymentMethod,
          paymentProofUrl: paymentProofUrl ?? null,
          paymentProofUploadedAt: paymentProofUrl ? new Date() : null,
          amountPaid: amountPaid ?? activity.price,
          paidAt: p2pPaymentStatus === 'VERIFIED' ? new Date() : null,
          paymentStatus: p2pPaymentStatus === 'VERIFIED' ? 'PAID' : 'PENDING',
        },
        update: {
          status: joinStatus,
          p2pPaymentStatus,
          p2pPaymentMethod: paymentMethod,
          paymentProofUrl: paymentProofUrl ?? null,
          paymentProofUploadedAt: paymentProofUrl ? new Date() : null,
          amountPaid: amountPaid ?? activity.price,
          paidAt: p2pPaymentStatus === 'VERIFIED' ? new Date() : null,
          paymentStatus: p2pPaymentStatus === 'VERIFIED' ? 'PAID' : 'PENDING',
        },
      })

      // Only increment attendee count if immediately verified (Stripe)
      if (p2pPaymentStatus === 'VERIFIED') {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { sessionsAttendedCount: { increment: 1 } },
        })
      }

      return NextResponse.json({ userActivity, paymentStatus: p2pPaymentStatus })
    }

    // Determine deposit fields for free sessions with deposits
    const hasDeposit = (activity as { requiresDeposit?: boolean }).requiresDeposit === true
    const depositAmount = hasDeposit
      ? (requestDepositAmount ?? (activity as { depositAmount?: number | null }).depositAmount ?? 500)
      : null
    const depositData = hasDeposit
      ? { depositAmount, depositStatus: 'HELD' as const }
      : {}

    // Upsert for free sessions
    const userActivity = await prisma.userActivity.upsert({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
      create: { userId: dbUser.id, activityId, status: 'JOINED', p2pPaymentStatus: 'VERIFIED', ...depositData },
      update: { status: 'JOINED', p2pPaymentStatus: 'VERIFIED', ...depositData },
    })

    // Increment attendee count
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { sessionsAttendedCount: { increment: 1 } },
    })

    const newAttendeeCount = activity.userActivities.length + 1

    // Send confirmation email to attendee (fire-and-forget)
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

    // Notify host (fire-and-forget) — skip if the host is joining their own session
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
    console.error('[buddy/sessions/join] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
