import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get user stats and profile info for profile page
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({
        totalAttended: 0,
        thisMonth: 0,
        upcoming: 0,
        wavesThisMonth: 0,
        crewsJoined: 0,
        profile: null,
      })
    }

    // Get user profile from database
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        slug: true,
        isHost: true,
        name: true,
        username: true,
      },
    })

    // Wave stats
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const wavesThisMonth = dbUser ? await prisma.waveParticipant.count({
      where: { userId: dbUser.id, wavedAt: { gte: startOfMonth } },
    }) : 0

    const crewsJoined = dbUser ? await prisma.crewChatMember.count({
      where: { userId: dbUser.id },
    }) : 0

    // Get all attendance records for this user
    const attendances = await prisma.eventAttendance.findMany({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
      select: {
        eventId: true,
      },
    })

    const eventIds = attendances.map(a => a.eventId)

    if (eventIds.length === 0) {
      return NextResponse.json({
        totalAttended: 0,
        thisMonth: 0,
        upcoming: 0,
        wavesThisMonth,
        crewsJoined,
        profile: dbUser ? {
          slug: dbUser.slug,
          isHost: dbUser.isHost,
          username: dbUser.username,
        } : null,
      })
    }

    // Get event details to calculate stats
    const events = await prisma.eventSubmission.findMany({
      where: {
        id: { in: eventIds },
      },
      select: {
        id: true,
        eventDate: true,
        recurring: true,
        day: true,
      },
    })

    let totalAttended = 0
    let thisMonth = 0
    let upcoming = 0

    events.forEach(event => {
      if (event.eventDate) {
        const eventDate = new Date(event.eventDate)

        if (eventDate < now) {
          // Past event
          totalAttended++
          if (eventDate >= startOfMonth) {
            thisMonth++
          }
        } else {
          // Future event
          upcoming++
          if (eventDate >= startOfMonth && eventDate <= new Date(now.getFullYear(), now.getMonth() + 1, 0)) {
            thisMonth++
          }
        }
      } else if (event.recurring) {
        // Recurring events count as attended and upcoming
        totalAttended++
        upcoming++
        thisMonth++
      }
    })

    return NextResponse.json({
      totalAttended,
      thisMonth,
      upcoming,
      wavesThisMonth,
      crewsJoined,
      profile: dbUser ? {
        slug: dbUser.slug,
        isHost: dbUser.isHost,
        username: dbUser.username,
      } : null,
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
