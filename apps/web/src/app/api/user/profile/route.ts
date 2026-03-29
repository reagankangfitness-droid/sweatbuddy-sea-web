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

// Update bio and basic profile fields
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (typeof body.bio === 'string') {
      updates.bio = body.bio.trim().slice(0, 200)
    }
    if (typeof body.headline === 'string') {
      updates.headline = body.headline.trim().slice(0, 200)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: updates,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[user/profile PATCH] Error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
