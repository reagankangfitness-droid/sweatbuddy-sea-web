import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Update attendance for multiple attendees at once
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const { attendees } = await request.json() as {
      attendees: { id: string; attended: boolean | null }[]
    }

    if (!Array.isArray(attendees)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Verify host owns this event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update all attendees
    const now = new Date()
    const updates = await Promise.all(
      attendees.map(({ id, attended }) =>
        prisma.eventAttendance.update({
          where: { id, eventId },
          data: {
            actuallyAttended: attended,
            markedAttendedAt: attended !== null ? now : null,
            markedAttendedBy: attended !== null ? session.email : null,
          },
        })
      )
    )

    return NextResponse.json({
      success: true,
      updated: updates.length,
    })
  } catch (error) {
    console.error('Update attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}

// Update single attendee attendance
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventId } = await params
    const { attendeeId, attended } = await request.json() as {
      attendeeId: string
      attended: boolean | null
    }

    if (!attendeeId) {
      return NextResponse.json({ error: 'Missing attendeeId' }, { status: 400 })
    }

    // Verify host owns this event
    const event = await prisma.eventSubmission.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        organizerInstagram: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.organizerInstagram.toLowerCase() !== session.instagramHandle.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the attendee
    const now = new Date()
    const updated = await prisma.eventAttendance.update({
      where: { id: attendeeId, eventId },
      data: {
        actuallyAttended: attended,
        markedAttendedAt: attended !== null ? now : null,
        markedAttendedBy: attended !== null ? session.email : null,
      },
    })

    return NextResponse.json({
      success: true,
      attendee: {
        id: updated.id,
        actuallyAttended: updated.actuallyAttended,
      },
    })
  } catch (error) {
    console.error('Update attendance error:', error)
    return NextResponse.json(
      { error: 'Failed to update attendance' },
      { status: 500 }
    )
  }
}
