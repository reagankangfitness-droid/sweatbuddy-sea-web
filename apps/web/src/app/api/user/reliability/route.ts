import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Returns the current user's reliability score and tier
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        reliabilityScore: true,
        hostTier: true,
        noShowCount: true,
        sessionsAttendedCount: true,
        sessionsHostedCount: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      reliabilityScore: dbUser.reliabilityScore,
      hostTier: dbUser.hostTier,
      noShowCount: dbUser.noShowCount,
      sessionsAttendedCount: dbUser.sessionsAttendedCount,
      sessionsHostedCount: dbUser.sessionsHostedCount,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch reliability info' },
      { status: 500 }
    )
  }
}
