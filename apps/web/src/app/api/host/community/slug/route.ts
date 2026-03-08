import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/host/community/slug - Get the host's community slug
export async function GET() {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!session.userId) {
      return NextResponse.json({ slug: null })
    }

    const community = await prisma.community.findFirst({
      where: { createdById: session.userId, isActive: true },
      select: { slug: true },
    })

    return NextResponse.json({ slug: community?.slug || null })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
