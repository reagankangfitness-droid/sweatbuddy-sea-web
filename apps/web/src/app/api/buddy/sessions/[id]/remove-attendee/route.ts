import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
      select: { id: true, userId: true, activityMode: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }
    if (activity.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Only the host can remove attendees' }, { status: 403 })
    }

    const body = await request.json()
    const { attendeeUserId } = body

    if (!attendeeUserId) {
      return NextResponse.json({ error: 'attendeeUserId is required' }, { status: 400 })
    }

    const userActivity = await prisma.userActivity.findUnique({
      where: { userId_activityId: { userId: attendeeUserId, activityId } },
    })

    if (!userActivity || userActivity.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Attendee not found in this session' }, { status: 404 })
    }

    await prisma.userActivity.update({
      where: { userId_activityId: { userId: attendeeUserId, activityId } },
      data: { status: 'CANCELLED' },
    })

    // TODO: send removal email to attendee

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[buddy/sessions/remove-attendee] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
