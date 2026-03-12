import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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

    // Find all userActivities where:
    // - the activity is hosted by this user
    // - paymentMethod is PAYNOW
    // - p2pPaymentStatus is PENDING
    const pending = await prisma.userActivity.findMany({
      where: {
        p2pPaymentMethod: 'PAYNOW',
        p2pPaymentStatus: 'PENDING',
        activity: {
          userId: dbUser.id,
          deletedAt: null,
        },
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, imageUrl: true },
        },
        activity: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            startTime: true,
          },
        },
      },
      orderBy: { paymentProofUploadedAt: 'asc' },
    })

    const payments = pending.map((ua) => ({
      id: ua.id,
      paymentProofUrl: ua.paymentProofUrl,
      amountPaid: ua.amountPaid,
      paymentProofUploadedAt: ua.paymentProofUploadedAt?.toISOString() ?? null,
      user: ua.user,
      activity: {
        ...ua.activity,
        startTime: ua.activity.startTime?.toISOString() ?? null,
      },
    }))

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('[p2p/payments/pending] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
