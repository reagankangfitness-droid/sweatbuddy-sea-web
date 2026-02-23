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

    // Get followers
    const followers = await prisma.userFollower.findMany({
      where: { followingId: profileUser.id },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
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

    const hasMore = followers.length > limit
    const items = hasMore ? followers.slice(0, limit) : followers
    const nextCursor = hasMore ? items[items.length - 1].id : null

    // If authenticated, check which followers the current user follows
    const { userId } = await auth()
    let followingSet = new Set<string>()

    if (userId) {
      const followerIds = items.map(f => f.follower.id)
      const currentUserFollowing = await prisma.userFollower.findMany({
        where: {
          followerId: userId,
          followingId: { in: followerIds }
        },
        select: { followingId: true }
      })
      followingSet = new Set(currentUserFollowing.map(f => f.followingId))
    }

    const users = items.map(f => ({
      id: f.follower.id,
      name: f.follower.name,
      firstName: f.follower.firstName,
      imageUrl: f.follower.imageUrl,
      slug: f.follower.slug,
      isFollowing: followingSet.has(f.follower.id),
    }))

    return NextResponse.json({ users, hasMore, nextCursor })
  } catch (error) {
    console.error('Followers fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch followers' },
      { status: 500 }
    )
  }
}
