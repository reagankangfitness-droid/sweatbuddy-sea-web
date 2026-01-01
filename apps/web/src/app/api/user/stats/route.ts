import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Get user stats (going count, saved count)
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
        goingCount: 0,
        savedCount: 0,
      })
    }

    // Get going count from EventAttendance
    const goingCount = await prisma.eventAttendance.count({
      where: {
        email: email.toLowerCase(),
        confirmed: true,
      },
    })

    // Saved events are stored in localStorage (client-side only)
    // Return 0 for now - this could be moved to DB later
    return NextResponse.json({
      goingCount,
      savedCount: 0, // Placeholder - saved events are in localStorage
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
