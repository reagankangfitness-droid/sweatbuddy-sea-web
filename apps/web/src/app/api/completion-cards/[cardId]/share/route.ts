import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { recordShare } from '@/lib/completion-cards'

// POST /api/completion-cards/[cardId]/share - Record a share/download event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

    // Get internal user ID
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { platform } = body // 'instagram', 'whatsapp', 'twitter', 'download'

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      )
    }

    const result = await recordShare(user.id, cardId, platform)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to record share' },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Record share error:', error)
    return NextResponse.json(
      { error: 'Failed to record share' },
      { status: 500 }
    )
  }
}
