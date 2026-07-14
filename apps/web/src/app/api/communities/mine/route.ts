import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentDbUser } from '@/lib/current-user'

// GET: list communities the user owns or is admin of
export async function GET() {
  try {
    const dbUser = await getCurrentDbUser()
    if (!dbUser) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

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
