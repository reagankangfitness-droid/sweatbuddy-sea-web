import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const cursor = url.searchParams.get('cursor') || undefined

    // Find the profile user
    const profileUser = await prisma.user.findUnique({
      where: { slug },
      select: { id: true }
    })

    if (!profileUser) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get following
    const following = await prisma.userFollower.findMany({
      where: { followerId: profileUser.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            firstName: true,
            imageUrl: true,
            slug: true,
          }
        }
      }
    })

    const hasMore = following.length > limit
    const items = hasMore ? following.slice(0, limit) : following
    const nextCursor = hasMore ? items[items.length - 1].id : null

    // If authenticated, check which users the current user follows
    const { userId } = await auth()
    let followingSet = new Set<string>()

    if (userId) {
      const followingIds = items.map(f => f.following.id)
      const currentUserFollowing = await prisma.userFollower.findMany({
        where: {
          followerId: userId,
          followingId: { in: followingIds }
        },
        select: { followingId: true }
      })
      followingSet = new Set(currentUserFollowing.map(f => f.followingId))
    }

    const users = items.map(f => ({
      id: f.following.id,
      name: f.following.name,
      firstName: f.following.firstName,
      imageUrl: f.following.imageUrl,
      slug: f.following.slug,
      isFollowing: followingSet.has(f.following.id),
    }))

    return NextResponse.json({ users, hasMore, nextCursor })
  } catch (error) {
    console.error('Following fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch following' },
      { status: 500 }
    )
  }
}
