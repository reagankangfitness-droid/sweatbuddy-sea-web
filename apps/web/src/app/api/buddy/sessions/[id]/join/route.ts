import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
      select: { id: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } },
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
    if (activity.userId === dbUser.id) {
      return NextResponse.json({ error: 'Cannot join your own session' }, { status: 400 })
    }
    if (activity.startTime && activity.startTime < new Date()) {
      return NextResponse.json({ error: 'Session has already started' }, { status: 400 })
    }

    // Capacity check
    const activeCount = activity.userActivities.length
    if (activity.maxPeople && activeCount >= activity.maxPeople) {
      return NextResponse.json({ error: 'Session is full' }, { status: 400 })
    }

    // Paid sessions — redirect to Stripe checkout (handled client-side)
    if (activity.activityMode === 'P2P_PAID') {
      return NextResponse.json(
        { error: 'Use checkout flow for paid sessions', code: 'USE_CHECKOUT' },
        { status: 400 }
      )
    }

    // Upsert for free sessions
    const userActivity = await prisma.userActivity.upsert({
      where: { userId_activityId: { userId: dbUser.id, activityId } },
      create: { userId: dbUser.id, activityId, status: 'JOINED' },
      update: { status: 'JOINED' },
    })

    // Increment attendee count
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { sessionsAttendedCount: { increment: 1 } },
    })

    return NextResponse.json({ userActivity })
  } catch (error) {
    console.error('[buddy/sessions/join] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
