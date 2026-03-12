import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email found' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { id: userActivityId } = await params
    const { approved, reason } = await req.json()

    // Find the userActivity and verify the current user is the host
    const userActivity = await prisma.userActivity.findUnique({
      where: { id: userActivityId },
      include: {
        activity: {
          select: { userId: true, title: true },
        },
        user: {
          select: { id: true },
        },
      },
    })

    if (!userActivity) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 })
    }

    // Verify current user is the session host
    if (userActivity.activity.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow verifying PENDING payments
    if (userActivity.p2pPaymentStatus !== 'PENDING') {
      return NextResponse.json({ error: 'Payment is not pending verification' }, { status: 400 })
    }

    if (approved) {
      // Approve: update status, mark as JOINED, increment attendee count
      await prisma.userActivity.update({
        where: { id: userActivityId },
        data: {
          p2pPaymentStatus: 'VERIFIED',
          verifiedByHost: true,
          verifiedAt: new Date(),
          status: 'JOINED',
          paidAt: new Date(),
          paymentStatus: 'PAID',
          hostVerificationNotes: reason ?? null,
        },
      })

      // Increment sessions attended count for the attendee
      await prisma.user.update({
        where: { id: userActivity.user.id },
        data: { sessionsAttendedCount: { increment: 1 } },
      })
    } else {
      // Reject
      await prisma.userActivity.update({
        where: { id: userActivityId },
        data: {
          p2pPaymentStatus: 'REJECTED',
          verifiedByHost: true,
          verifiedAt: new Date(),
          hostVerificationNotes: reason ?? null,
          paymentStatus: 'FAILED',
        },
      })
    }

    return NextResponse.json({ success: true, approved })
  } catch (error) {
    console.error('[p2p/payments/verify] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
