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

    // Single lightweight query
    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        slug: true,
        isHost: true,
      },
    })

    return NextResponse.json({
      profile: dbUser ? {
        slug: dbUser.slug,
        isHost: dbUser.isHost,
      } : null,
    })
  } catch {
    return NextResponse.json({ profile: null })
  }
}
