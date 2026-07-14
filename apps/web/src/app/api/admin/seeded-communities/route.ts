import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminRequest } from '@/lib/admin-route'

export async function GET(request: Request) {
  const unauthorized = await requireAdminRequest(request)
  if (unauthorized) return unauthorized

  try {
    const communities = await prisma.community.findMany({
      where: { isSeeded: true },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        instagramHandle: true,
        websiteUrl: true,
        communityLink: true,
        logoImage: true,
        coverImage: true,
        memberCount: true,
        isSeeded: true,
        claimableBy: true,
        claimedAt: true,
        claimedById: true,
        createdAt: true,
        city: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const result = communities.map((c) => ({
      ...c,
      status: c.claimedAt ? 'claimed' : 'unclaimed',
    }))

    return NextResponse.json({ communities: result })
  } catch (error) {
    console.error('Error fetching seeded communities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch seeded communities' },
      { status: 500 }
    )
  }
}
