import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { notify } from '@/lib/notifications/service'

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
      select: { id: true, name: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify user is the host of this session
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: {
        id: true,
        title: true,
        userId: true,
        hostId: true,
        startTime: true,
        address: true,
        city: true,
        userActivities: {
          where: { status: { in: ['JOINED', 'COMPLETED'] } },
          select: { userId: true },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (activity.userId !== dbUser.id && activity.hostId !== dbUser.id) {
      return NextResponse.json({ error: 'Only the host can notify attendees' }, { status: 403 })
    }

    if (activity.userActivities.length === 0) {
      return NextResponse.json({ error: 'No attendees to notify' }, { status: 400 })
    }

    // Format time for notification
    const timeStr = activity.startTime
      ? activity.startTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Singapore' })
      : ''
    const location = activity.address?.split(',')[0] ?? activity.city ?? ''

    // Send push notification to all attendees
    const notifications = activity.userActivities.map((ua) =>
      notify({
        userId: ua.userId,
        type: 'ACTIVITY_UPDATE',
        title: `Update from ${dbUser.name ?? 'your host'}`,
        body: `${activity.title}${timeStr ? ` — ${timeStr}` : ''}${location ? ` at ${location}` : ''}`,
        linkUrl: `/activities/${activityId}`,
      }).catch(() => {})
    )

    await Promise.allSettled(notifications)

    return NextResponse.json({ success: true, notified: activity.userActivities.length })
  } catch (error) {
    console.error('[buddy/sessions/notify] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
