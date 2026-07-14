import { NextResponse } from 'next/server'
import type { CommunityClaimStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

const VALID_STATUSES = new Set<CommunityClaimStatus>(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('status')?.toUpperCase()
  const status = rawStatus && VALID_STATUSES.has(rawStatus as CommunityClaimStatus)
    ? rawStatus as CommunityClaimStatus
    : null

  const [claims, groupedCounts] = await Promise.all([
    prisma.communityClaim.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            moderationStatus: true,
            verificationStatus: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        challenges: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            status: true,
            attempts: true,
            targetUrl: true,
            expiresAt: true,
            lastCheckedAt: true,
            lastError: true,
          },
        },
      },
    }),
    prisma.communityClaim.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const counts = Object.fromEntries(groupedCounts.map((row) => [row.status, row._count._all]))

  return NextResponse.json({ claims, counts, total: claims.length })
}
