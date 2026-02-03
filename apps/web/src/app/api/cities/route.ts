import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cities - List all cities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const launchedOnly = searchParams.get('launched') === 'true'

    const where = launchedOnly ? { isLaunched: true } : {}

    const cities = await prisma.city.findMany({
      where,
      orderBy: [
        { isLaunched: 'desc' },
        { communityCount: 'desc' },
      ],
    })

    return NextResponse.json({ cities })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
