import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify user is the host
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { id: true, userId: true, hostId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (activity.userId !== dbUser.id && activity.hostId !== dbUser.id) {
      return NextResponse.json({ error: 'Only the host can view attendance' }, { status: 403 })
    }

    const attendees = await prisma.userActivity.findMany({
      where: {
        activityId,
        status: { in: ['JOINED', 'COMPLETED'] },
      },
      select: {
        userId: true,
        actuallyAttended: true,
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      attendees: attendees.map((a) => ({
        id: a.user.id,
        name: a.user.name,
        imageUrl: a.user.imageUrl,
        actuallyAttended: a.actuallyAttended,
      })),
    })
  } catch (error) {
    console.error('[buddy/sessions/attendance] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify user is the host
    const activity = await prisma.activity.findUnique({
      where: { id: activityId, deletedAt: null },
      select: { id: true, userId: true, hostId: true },
    })

    if (!activity) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (activity.userId !== dbUser.id && activity.hostId !== dbUser.id) {
      return NextResponse.json({ error: 'Only the host can mark attendance' }, { status: 403 })
    }

    const body = await req.json()
    const { attendeeId, attended } = body as { attendeeId: string; attended: boolean | null }

    if (!attendeeId) {
      return NextResponse.json({ error: 'attendeeId is required' }, { status: 400 })
    }

    const updated = await prisma.userActivity.update({
      where: {
        userId_activityId: {
          userId: attendeeId,
          activityId,
        },
      },
      data: {
        actuallyAttended: attended,
        markedAttendedAt: new Date(),
        markedAttendedBy: dbUser.id,
      },
      select: {
        userId: true,
        actuallyAttended: true,
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: updated.user.id,
      name: updated.user.name,
      imageUrl: updated.user.imageUrl,
      actuallyAttended: updated.actuallyAttended,
    })
  } catch (error) {
    console.error('[buddy/sessions/attendance] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
