import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { toggleFollow, isFollowing } from '@/lib/profile'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get profile to check follow status
    const profile = await prisma.user.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const following = await isFollowing(userId, profile.id)
    return NextResponse.json({ following })
  } catch (error) {
    console.error('Follow status error:', error)
    return NextResponse.json(
      { error: 'Failed to get follow status' },
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

    // Get profile to follow
    const profile = await prisma.user.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Can't follow yourself
    if (profile.id === userId) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      )
    }

    const result = await toggleFollow(userId, profile.id)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Follow error:', error)
    return NextResponse.json(
      { error: 'Failed to process follow' },
      { status: 500 }
    )
  }
}
