import { NextResponse } from 'next/server'
import type { CommunityNominationStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

const VALID_STATUSES = new Set<CommunityNominationStatus>(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'])

export async function GET(request: Request) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('status')?.toUpperCase()
  const status = rawStatus && VALID_STATUSES.has(rawStatus as CommunityNominationStatus)
    ? rawStatus as CommunityNominationStatus
    : null

  const nominations = await prisma.communityNomination.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const counts = await prisma.communityNomination.groupBy({
    by: ['status'],
    _count: { _all: true },
  })

  return NextResponse.json({
    nominations,
    counts: counts.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = row._count._all
      return acc
    }, {}),
  })
}
