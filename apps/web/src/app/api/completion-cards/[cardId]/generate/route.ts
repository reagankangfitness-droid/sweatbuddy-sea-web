import { NextRequest, NextResponse } from 'next/server'
import { markCardAsGenerated } from '@/lib/completion-cards'
import { getCurrentDbUser } from '@/lib/current-user'

// POST /api/completion-cards/[cardId]/generate - Mark card as generated
// Note: The actual image generation happens client-side using canvas
// This endpoint updates the database with the generated card URL
export async function POST(
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
    const { cardUrl } = body

    if (!cardUrl) {
      return NextResponse.json(
        { error: 'Card URL is required' },
        { status: 400 }
      )
    }

    const result = await markCardAsGenerated(user.id, cardId, cardUrl)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, cardUrl })
  } catch (error) {
    console.error('Generate card error:', error)
    return NextResponse.json(
      { error: 'Failed to update card' },
      { status: 500 }
    )
  }
}
