import { NextRequest, NextResponse } from 'next/server'
import {
  getCompletionCard,
  updateCompletionCard,
  getAvailableTemplates,
} from '@/lib/completion-cards'
import { CompletionCardTemplate } from '@prisma/client'
import { getCurrentDbUser } from '@/lib/current-user'

// GET /api/completion-cards/[cardId] - Get a specific card
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const user = await getCurrentDbUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

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
    const user = await getCurrentDbUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { cardId } = await params

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
