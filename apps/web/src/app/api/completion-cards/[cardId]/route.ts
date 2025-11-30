import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  getCompletionCard,
  updateCompletionCard,
  getAvailableTemplates,
} from '@/lib/completion-cards'
import { CompletionCardTemplate } from '@prisma/client'

// GET /api/completion-cards/[cardId] - Get a specific card
export async function GET(
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

    const card = await getCompletionCard(user.id, cardId)

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    return NextResponse.json({
      card,
      templates: getAvailableTemplates(),
    })
  } catch (error) {
    console.error('Get completion card error:', error)
    return NextResponse.json(
      { error: 'Failed to get card' },
      { status: 500 }
    )
  }
}

// PUT /api/completion-cards/[cardId] - Update card customization
export async function PUT(
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
    const { template, caption, showHost, showDate, showDuration, showStreak } = body

    const result = await updateCompletionCard(user.id, cardId, {
      template: template as CompletionCardTemplate | undefined,
      caption,
      showHost,
      showDate,
      showDuration,
      showStreak,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, card: result.card })
  } catch (error) {
    console.error('Update completion card error:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}
