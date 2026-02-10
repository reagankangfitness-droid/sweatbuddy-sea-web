import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toggleInterest, getInterestCount, isInterested } from '@/lib/interest'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const profile = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const count = await getInterestCount(profile.id)

    // Check if current user is interested
    const { userId } = await auth()
    let interested = false
    if (userId) {
      interested = await isInterested(userId, profile.id)
    }

    return NextResponse.json({ count, interested })
  } catch (error) {
    console.error('Interest status error:', error)
    return NextResponse.json(
      { error: 'Failed to get interest status' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.user.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Can't signal interest in yourself
    if (profile.id === userId) {
      return NextResponse.json(
        { error: 'Cannot signal interest in yourself' },
        { status: 400 }
      )
    }

    // Parse optional body fields
    let categorySlug: string | undefined
    let message: string | undefined
    try {
      const body = await request.json()
      categorySlug = body.categorySlug
      message = body.message
    } catch {
      // No body or invalid JSON is fine — toggle with defaults
    }

    const result = await toggleInterest(userId, profile.id, categorySlug, message)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Interest toggle error:', error)
    return NextResponse.json(
      { error: 'Failed to process interest' },
      { status: 500 }
    )
  }
}
