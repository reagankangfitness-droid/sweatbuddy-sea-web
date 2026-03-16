import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Lightweight endpoint just for profile/host status
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress

    if (!email) {
      return NextResponse.json({ profile: null })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        slug: true,
        isHost: true,
        isCoach: true,
        coachVerificationStatus: true,
        bio: true,
        fitnessLevel: true,
        fitnessInterests: true,
        sessionsHostedCount: true,
        sessionsAttendedCount: true,
      },
    })

    return NextResponse.json({
      profile: dbUser ? {
        slug: dbUser.slug,
        isHost: dbUser.isHost,
        isCoach: dbUser.isCoach,
        coachVerificationStatus: dbUser.coachVerificationStatus,
        bio: dbUser.bio,
        fitnessLevel: dbUser.fitnessLevel,
        fitnessInterests: dbUser.fitnessInterests,
        sessionsHostedCount: dbUser.sessionsHostedCount,
        sessionsAttendedCount: dbUser.sessionsAttendedCount,
      } : null,
    })
  } catch {
    return NextResponse.json({ profile: null })
  }
}
