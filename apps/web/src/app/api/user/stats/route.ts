import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get user stats (this month, total attended)
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({
        totalAttended: 0,
        thisMonth: 0,
        upcoming: 0,
      })
    }

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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

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
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
