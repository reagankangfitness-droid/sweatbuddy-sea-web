import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'PENDING'
  const city = searchParams.get('city')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)))
  const skip = (page - 1) * limit

  const where = {
    ...(status && status !== 'all' ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'DUPLICATE' | 'ARCHIVED' } : {}),
    ...(city ? { city: { equals: city, mode: 'insensitive' as const } } : {}),
  }

  const [sessions, total, counts] = await Promise.all([
    prisma.discoveredSession.findMany({
      where,
      orderBy: [
        { startTime: 'asc' },
        { confidence: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip,
      include: { source: true, createdActivity: { select: { id: true, title: true, status: true } } },
    }),
    prisma.discoveredSession.count({ where }),
    prisma.discoveredSession.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
  ])

  return NextResponse.json({ sessions, total, page, limit, counts })
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const sourceId = String(body.sourceId ?? '').trim()
    const title = String(body.title ?? '').trim()
    const sourceUrl = String(body.sourceUrl ?? '').trim()

    if (!sourceId || !title || !sourceUrl) {
      return NextResponse.json({ error: 'sourceId, title, and sourceUrl are required' }, { status: 400 })
    }

    const session = await prisma.discoveredSession.create({
      data: {
        sourceId,
        title,
        description: body.description ? String(body.description) : null,
        category: body.category ? String(body.category) : null,
        city: String(body.city ?? 'Singapore'),
        location: body.location ? String(body.location) : null,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
        timezone: String(body.timezone ?? 'Asia/Singapore'),
        price: typeof body.price === 'number' ? body.price : null,
        currency: String(body.currency ?? 'SGD').slice(0, 3).toUpperCase(),
        signupUrl: body.signupUrl ? String(body.signupUrl) : null,
        sourceUrl,
        imageUrl: body.imageUrl ? String(body.imageUrl) : null,
        hostName: body.hostName ? String(body.hostName) : null,
        communityName: body.communityName ? String(body.communityName) : null,
        confidence: typeof body.confidence === 'number' ? body.confidence : 60,
        rawData: { manual: true },
      },
    })

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Discovered session create error:', error)
    return NextResponse.json({ error: 'Failed to create discovered session' }, { status: 500 })
  }
}
