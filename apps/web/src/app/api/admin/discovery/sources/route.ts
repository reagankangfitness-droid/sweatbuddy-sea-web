import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminRequest } from '@/lib/admin-auth'

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const city = searchParams.get('city')

  const sources = await prisma.discoverySource.findMany({
    where: {
      ...(status && status !== 'all' ? { status: status as 'ACTIVE' | 'PAUSED' | 'ERROR' } : {}),
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    include: {
      _count: {
        select: { discoveredSessions: true },
      },
    },
  })

  return NextResponse.json({ sources })
}

export async function POST(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim()
    const rawUrl = String(body.url ?? '').trim()
    const city = String(body.city ?? 'Singapore').trim() || 'Singapore'
    const category = String(body.category ?? '').trim() || null
    const notes = String(body.notes ?? '').trim() || null
    const sourceType = String(body.sourceType ?? 'WEBSITE').toUpperCase()

    if (!name || !rawUrl) {
      return NextResponse.json({ error: 'Name and URL are required' }, { status: 400 })
    }

    let url: string
    try {
      url = new URL(rawUrl).toString()
    } catch {
      return NextResponse.json({ error: 'Invalid source URL' }, { status: 400 })
    }

    const source = await prisma.discoverySource.upsert({
      where: { url },
      update: {
        name,
        city,
        category,
        notes,
        sourceType: sourceType as 'WEBSITE',
        status: 'ACTIVE',
      },
      create: {
        name,
        url,
        city,
        category,
        notes,
        sourceType: sourceType as 'WEBSITE',
      },
    })

    return NextResponse.json({ source }, { status: 201 })
  } catch (error) {
    console.error('Discovery source create error:', error)
    return NextResponse.json({ error: 'Failed to save source' }, { status: 500 })
  }
}
