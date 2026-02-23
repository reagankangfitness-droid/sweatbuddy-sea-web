import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const newCommunities = await prisma.community.findMany({
      where: {
        isActive: true,
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        coverImage: true,
        logoImage: true,
        memberCount: true,
        createdBy: {
          select: { imageUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    })

    return NextResponse.json({ newCommunities })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
