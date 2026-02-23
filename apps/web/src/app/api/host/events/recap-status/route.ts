import { NextResponse } from 'next/server'
import { getHostSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const session = await getHostSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { eventIds } = await request.json()

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ recappedEventIds: [] })
    }

    const recaps = await prisma.eventRecap.findMany({
      where: {
        eventSubmissionId: { in: eventIds },
      },
      select: {
        eventSubmissionId: true,
      },
    })

    return NextResponse.json({
      recappedEventIds: recaps.map((r) => r.eventSubmissionId),
    })
  } catch (error) {
    console.error('Recap status error:', error)
    return NextResponse.json({ error: 'Failed to check recap status' }, { status: 500 })
  }
}
