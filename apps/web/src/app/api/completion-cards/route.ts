import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  createCompletionCard,
  getUserCompletionCards,
} from '@/lib/completion-cards'

// GET /api/completion-cards - Get user's completion cards
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get internal user ID
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')

    const cards = await getUserCompletionCards(user.id, { limit, page })

    return NextResponse.json({ cards })
  } catch (error) {
    console.error('Get completion cards error:', error)
    return NextResponse.json(
      { error: 'Failed to get cards' },
      { status: 500 }
    )
  }
}

// POST /api/completion-cards - Create a new completion card
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()

    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get internal user ID
    const user = await prisma.user.findFirst({
      where: { id: clerkUserId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { userActivityId, photoUrl } = body

    if (!userActivityId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'Photo URL is required' },
        { status: 400 }
      )
    }

    const result = await createCompletionCard(user.id, userActivityId, photoUrl)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      card: result.card,
      isUpdate: result.isUpdate,
    })
  } catch (error) {
    console.error('Create completion card error:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
