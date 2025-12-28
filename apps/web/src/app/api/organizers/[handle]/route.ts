import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { handle: string } }
) {
  try {
    const { handle } = params

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle required' },
        { status: 400 }
      )
    }

    // Find user by Instagram handle (organizerInstagram in events)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { instagram: handle },
          { instagram: `@${handle}` },
        ]
      },
      select: {
        id: true,
        name: true,
        firstName: true,
        imageUrl: true,
        bio: true,
        instagram: true,
      }
    })

    // Get organizer stats from their events
    const stats = await prisma.eventSubmission.aggregate({
      where: {
        organizerInstagram: {
          in: [handle, `@${handle}`]
        },
        status: 'APPROVED'
      },
      _count: { id: true }
    })

    // Get total attendees across all their events
    const eventIds = await prisma.eventSubmission.findMany({
      where: {
        organizerInstagram: {
          in: [handle, `@${handle}`]
        },
        status: 'APPROVED'
      },
      select: { id: true }
    })

    const totalAttendees = await prisma.eventAttendance.count({
      where: {
        eventId: { in: eventIds.map(e => e.id) }
      }
    })

    const organizer = {
      id: user?.id || handle,
      name: user ? (user.firstName || user.name || handle).trim() : handle,
      handle: handle.replace('@', ''),
      imageUrl: user?.imageUrl || null,
      bio: user?.bio || null,
      eventsHosted: stats._count.id || 0,
      totalAttendees: totalAttendees || 0,
      isVerified: !!user, // Verified if they have a user account
    }

    return NextResponse.json({ organizer })
  } catch (error) {
    console.error('Error fetching organizer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch organizer' },
      { status: 500 }
    )
  }
}
