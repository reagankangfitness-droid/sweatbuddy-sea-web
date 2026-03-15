import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { BADGE_DEFINITIONS } from '@/lib/badges'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 })
    }

    // Find the database user by email
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        earnedBadges: {
          select: {
            earnedAt: true,
            badge: {
              select: {
                slug: true,
                name: true,
                emoji: true,
              },
            },
          },
          orderBy: { earnedAt: 'desc' },
        },
      },
    })

    if (!dbUser) {
      return NextResponse.json({ badges: [], available: [] })
    }

    const earnedSlugs = new Set(
      dbUser.earnedBadges.map((eb) => eb.badge.slug)
    )

    const badges = dbUser.earnedBadges.map((eb) => ({
      slug: eb.badge.slug,
      name: eb.badge.name,
      emoji: eb.badge.emoji,
      earnedAt: eb.earnedAt.toISOString(),
    }))

    const available = BADGE_DEFINITIONS.filter(
      (b) => !earnedSlugs.has(b.slug)
    ).map((b) => ({
      slug: b.slug,
      name: b.name,
      emoji: b.emoji,
      criteria: b.criteria,
      threshold: b.threshold,
    }))

    return NextResponse.json({ badges, available })
  } catch (error) {
    console.error('User badges error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch badges' },
      { status: 500 }
    )
  }
}
