import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET: list communities the user owns or is admin of
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Communities user owns or is admin of
    const communities = await prisma.community.findMany({
      where: {
        isActive: true,
        OR: [
          { createdById: dbUser.id },
          { claimedById: dbUser.id },
          { members: { some: { userId: dbUser.id, role: { in: ['ADMIN', 'OWNER'] } } } },
        ],
      },
      select: { id: true, name: true, slug: true, logoImage: true, coverImage: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ communities })
  } catch (error) {
    console.error('[communities/mine] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
