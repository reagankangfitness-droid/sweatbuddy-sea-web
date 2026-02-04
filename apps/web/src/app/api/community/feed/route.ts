import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBlockedUserIds } from '@/lib/blocks'

interface FeedItem {
  id: string
  type: 'event_joined' | 'activity_joined' | 'new_event' | 'new_follow'
  timestamp: string
  actor: {
    id: string
    name: string
    imageUrl: string | null
    slug: string | null
  }
  event?: {
    id: string
    name: string
    imageUrl: string | null
    category: string
    slug: string | null
    date: string | null
    location: string
  }
  target?: {
    id: string
    name: string
    imageUrl: string | null
    slug: string | null
  }
}

const PAGE_SIZE = 20
const FEED_WINDOW_DAYS = 7

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    const { searchParams } = request.nextUrl
    const tab = searchParams.get('tab') || 'all'
    const cursor = searchParams.get('cursor')

    if (tab !== 'all' && tab !== 'following') {
      return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })
    }

    // Following tab requires auth
    if (tab === 'following' && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get blocked user IDs (empty set if not authenticated)
    const blockedIds = userId
      ? await getBlockedUserIds(userId)
      : new Set<string>()

    // Get followed user IDs if on following tab
    let followedUserIds: string[] = []
    if (tab === 'following' && userId) {
      const follows = await prisma.userFollower.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      })
      followedUserIds = follows.map((f) => f.followingId)
      if (followedUserIds.length === 0) {
        return NextResponse.json({ items: [], nextCursor: null })
      }
    }

    const since = new Date()
    since.setDate(since.getDate() - FEED_WINDOW_DAYS)

    const cursorDate = cursor ? new Date(cursor) : undefined

    const items: FeedItem[] = []

    // Query all sources in parallel
    const [eventAttendances, userActivities, eventSubmissions, userFollows] =
      await Promise.all([
        // 1. EventAttendance (confirmed=true) -> event_joined
        queryEventAttendances(since, cursorDate, blockedIds, tab === 'following' ? followedUserIds : null),
        // 2. UserActivity (status=JOINED) -> activity_joined
        queryUserActivities(since, cursorDate, blockedIds, tab === 'following' ? followedUserIds : null),
        // 3. EventSubmission (status=APPROVED) -> new_event
        queryEventSubmissions(since, cursorDate, blockedIds, tab === 'following' ? followedUserIds : null),
        // 4. UserFollower -> new_follow
        queryUserFollows(since, cursorDate, blockedIds, tab === 'following' ? followedUserIds : null),
      ])

    items.push(...eventAttendances, ...userActivities, ...eventSubmissions, ...userFollows)

    // Sort by timestamp desc
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Limit to PAGE_SIZE
    const pageItems = items.slice(0, PAGE_SIZE)
    const nextCursor =
      pageItems.length === PAGE_SIZE
        ? pageItems[pageItems.length - 1].timestamp
        : null

    return NextResponse.json({ items: pageItems, nextCursor })
  } catch (error) {
    console.error('Community feed error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    )
  }
}

async function queryEventAttendances(
  since: Date,
  cursor: Date | undefined,
  blockedIds: Set<string>,
  followedUserIds: string[] | null
): Promise<FeedItem[]> {
  // EventAttendance uses email, not userId directly
  // We need to join through email to find the user
  const attendances = await prisma.eventAttendance.findMany({
    where: {
      confirmed: true,
      timestamp: {
        gte: since,
        ...(cursor ? { lt: cursor } : {}),
      },
    },
    orderBy: { timestamp: 'desc' },
    take: PAGE_SIZE,
    select: {
      id: true,
      eventId: true,
      eventName: true,
      email: true,
      name: true,
      timestamp: true,
    },
  })

  if (attendances.length === 0) return []

  // Look up users by email
  const emails = [...new Set(attendances.map((a) => a.email))]
  const users = await prisma.user.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true, name: true, imageUrl: true, slug: true },
  })
  const userByEmail = new Map(users.map((u) => [u.email, u]))

  // Look up event details from EventSubmission
  const eventIds = [...new Set(attendances.map((a) => a.eventId))]
  const events = await prisma.eventSubmission.findMany({
    where: { id: { in: eventIds } },
    select: {
      id: true,
      eventName: true,
      imageUrl: true,
      category: true,
      slug: true,
      eventDate: true,
      location: true,
    },
  })
  const eventById = new Map(events.map((e) => [e.id, e]))

  const items: FeedItem[] = []
  for (const att of attendances) {
    const user = userByEmail.get(att.email)
    if (!user) continue
    if (blockedIds.has(user.id)) continue
    if (followedUserIds && !followedUserIds.includes(user.id)) continue

    const event = eventById.get(att.eventId)

    items.push({
      id: `ea_${att.id}`,
      type: 'event_joined',
      timestamp: att.timestamp.toISOString(),
      actor: {
        id: user.id,
        name: user.name || att.name || 'Someone',
        imageUrl: user.imageUrl,
        slug: user.slug,
      },
      event: {
        id: att.eventId,
        name: event?.eventName || att.eventName,
        imageUrl: event?.imageUrl || null,
        category: event?.category || '',
        slug: event?.slug || null,
        date: event?.eventDate?.toISOString() || null,
        location: event?.location || '',
      },
    })
  }

  return items
}

async function queryUserActivities(
  since: Date,
  cursor: Date | undefined,
  blockedIds: Set<string>,
  followedUserIds: string[] | null
): Promise<FeedItem[]> {
  const blockedArray = [...blockedIds]

  const activities = await prisma.userActivity.findMany({
    where: {
      status: 'JOINED',
      createdAt: {
        gte: since,
        ...(cursor ? { lt: cursor } : {}),
      },
      userId: {
        ...(blockedArray.length > 0 ? { notIn: blockedArray } : {}),
        ...(followedUserIds ? { in: followedUserIds } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      user: {
        select: { id: true, name: true, imageUrl: true, slug: true },
      },
      activity: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          categorySlug: true,
          startTime: true,
          city: true,
          address: true,
        },
      },
    },
  })

  return activities.map((ua) => ({
    id: `ua_${ua.id}`,
    type: 'activity_joined' as const,
    timestamp: ua.createdAt.toISOString(),
    actor: {
      id: ua.user.id,
      name: ua.user.name || 'Someone',
      imageUrl: ua.user.imageUrl,
      slug: ua.user.slug,
    },
    event: {
      id: ua.activity.id,
      name: ua.activity.title,
      imageUrl: ua.activity.imageUrl,
      category: ua.activity.categorySlug || '',
      slug: null,
      date: ua.activity.startTime?.toISOString() || null,
      location: ua.activity.address || ua.activity.city,
    },
  }))
}

async function queryEventSubmissions(
  since: Date,
  cursor: Date | undefined,
  blockedIds: Set<string>,
  followedUserIds: string[] | null
): Promise<FeedItem[]> {
  const blockedArray = [...blockedIds]

  const submissions = await prisma.eventSubmission.findMany({
    where: {
      status: 'APPROVED',
      createdAt: {
        gte: since,
        ...(cursor ? { lt: cursor } : {}),
      },
      submittedByUserId: {
        not: null,
        ...(blockedArray.length > 0 ? { notIn: blockedArray } : {}),
        ...(followedUserIds ? { in: followedUserIds } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      submittedByUser: {
        select: { id: true, name: true, imageUrl: true, slug: true },
      },
    },
  })

  return submissions
    .filter((s) => s.submittedByUser)
    .map((s) => ({
      id: `es_${s.id}`,
      type: 'new_event' as const,
      timestamp: s.createdAt.toISOString(),
      actor: {
        id: s.submittedByUser!.id,
        name: s.submittedByUser!.name || s.organizerName,
        imageUrl: s.submittedByUser!.imageUrl,
        slug: s.submittedByUser!.slug,
      },
      event: {
        id: s.id,
        name: s.eventName,
        imageUrl: s.imageUrl,
        category: s.category,
        slug: s.slug,
        date: s.eventDate?.toISOString() || null,
        location: s.location,
      },
    }))
}

async function queryUserFollows(
  since: Date,
  cursor: Date | undefined,
  blockedIds: Set<string>,
  followedUserIds: string[] | null
): Promise<FeedItem[]> {
  const blockedArray = [...blockedIds]

  const follows = await prisma.userFollower.findMany({
    where: {
      createdAt: {
        gte: since,
        ...(cursor ? { lt: cursor } : {}),
      },
      followerId: {
        ...(blockedArray.length > 0 ? { notIn: blockedArray } : {}),
        ...(followedUserIds ? { in: followedUserIds } : {}),
      },
      followingId: {
        ...(blockedArray.length > 0 ? { notIn: blockedArray } : {}),
      },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE,
    include: {
      follower: {
        select: { id: true, name: true, imageUrl: true, slug: true },
      },
      following: {
        select: { id: true, name: true, imageUrl: true, slug: true },
      },
    },
  })

  return follows.map((f) => ({
    id: `uf_${f.id}`,
    type: 'new_follow' as const,
    timestamp: f.createdAt.toISOString(),
    actor: {
      id: f.follower.id,
      name: f.follower.name || 'Someone',
      imageUrl: f.follower.imageUrl,
      slug: f.follower.slug,
    },
    target: {
      id: f.following.id,
      name: f.following.name || 'Someone',
      imageUrl: f.following.imageUrl,
      slug: f.following.slug,
    },
  }))
}
