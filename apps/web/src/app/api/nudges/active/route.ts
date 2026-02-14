import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/nudges/active — returns up to 3 unread NUDGE notifications for current user
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nudges = await prisma.notification.findMany({
      where: {
        userId,
        type: 'NUDGE',
        isRead: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    })

    return NextResponse.json({ nudges })
  } catch (error) {
    console.error('Error fetching active nudges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/nudges/active — dismiss a nudge (mark as read, record action)
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { nudgeId, action } = body

    if (!nudgeId) {
      return NextResponse.json({ error: 'nudgeId required' }, { status: 400 })
    }

    // Verify the nudge belongs to this user
    const nudge = await prisma.notification.findFirst({
      where: { id: nudgeId, userId, type: 'NUDGE' },
    })

    if (!nudge) {
      return NextResponse.json({ error: 'Nudge not found' }, { status: 404 })
    }

    // Mark as read and record the action in metadata
    const existingMetadata = (nudge.metadata as Record<string, unknown>) || {}
    await prisma.notification.update({
      where: { id: nudgeId },
      data: {
        isRead: true,
        metadata: {
          ...existingMetadata,
          dismissedAction: action || 'dismissed',
          dismissedAt: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error dismissing nudge:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
