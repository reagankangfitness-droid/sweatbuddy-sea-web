import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { STATUS_DURATION_MS } from '@/lib/im-down/constants'
import { ImDownActivity } from '@prisma/client'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const status = await prisma.userStatus.findUnique({
    where: { userId: dbUser.id },
  })

  if (!status || status.expiresAt < new Date()) {
    return NextResponse.json({ status: null })
  }

  return NextResponse.json({ status })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await request.json()
  const { activityType, statusText, latitude, longitude } = body as {
    activityType: ImDownActivity
    statusText?: string
    latitude: number
    longitude: number
  }

  if (!activityType || latitude == null || longitude == null) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + STATUS_DURATION_MS)

  const status = await prisma.userStatus.upsert({
    where: { userId: dbUser.id },
    create: {
      userId: dbUser.id,
      activityType,
      statusText: statusText || null,
      latitude,
      longitude,
      setAt: now,
      expiresAt,
    },
    update: {
      activityType,
      statusText: statusText || null,
      latitude,
      longitude,
      setAt: now,
      expiresAt,
    },
  })

  return NextResponse.json({ status })
}

export async function DELETE() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dbUser = await prisma.user.findFirst({ where: { id: userId } })
  if (!dbUser) return new NextResponse(null, { status: 204 })

  await prisma.userStatus.deleteMany({ where: { userId: dbUser.id } })

  return new NextResponse(null, { status: 204 })
}
