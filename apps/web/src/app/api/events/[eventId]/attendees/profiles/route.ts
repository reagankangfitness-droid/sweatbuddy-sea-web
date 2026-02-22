import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID required' },
        { status: 400 }
      )
    }

    // Auth optional — works for logged-out visitors too
    const { userId } = await auth()

    // Get joined attendees with user profile data
    const userActivities = await prisma.userActivity.findMany({
      where: {
        activityId: eventId,
        status: 'JOINED',
        deletedAt: null,
        user: { isPublic: true },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: {
        userId: true,
        goingSolo: true,
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            imageUrl: true,
            bio: true,
            fitnessInterests: true,
            isPublic: true,
          },
        },
      },
    })

    // Build follow status map and mutual events map if logged in
    let followingSet = new Set<string>()
    let mutualEventsMap = new Map<string, string[]>()

    if (userId) {
      const attendeeIds = userActivities.map((ua) => ua.userId)

      // Check which attendees the requester follows
      const follows = await prisma.userFollower.findMany({
        where: {
          followerId: userId,
          followingId: { in: attendeeIds },
        },
        select: { followingId: true },
      })
      followingSet = new Set(follows.map((f) => f.followingId))

      // Find shared upcoming events (max 2 per attendee)
      const now = new Date()
      const myUpcomingActivities = await prisma.userActivity.findMany({
        where: {
          userId,
          status: 'JOINED',
          deletedAt: null,
          activity: { startTime: { gt: now } },
        },
        select: {
          activityId: true,
          activity: { select: { title: true } },
        },
      })

      if (myUpcomingActivities.length > 0) {
        const myActivityIds = myUpcomingActivities.map((ua) => ua.activityId)
        const activityTitleMap = new Map(
          myUpcomingActivities.map((ua) => [ua.activityId, ua.activity.title])
        )

        // Find which attendees share upcoming activities with requester
        const sharedActivities = await prisma.userActivity.findMany({
          where: {
            userId: { in: attendeeIds },
            activityId: { in: myActivityIds, not: eventId },
            status: 'JOINED',
            deletedAt: null,
          },
          select: {
            userId: true,
            activityId: true,
          },
        })

        for (const sa of sharedActivities) {
          const title = activityTitleMap.get(sa.activityId)
          if (!title) continue
          const existing = mutualEventsMap.get(sa.userId) || []
          if (existing.length < 2) {
            existing.push(title)
            mutualEventsMap.set(sa.userId, existing)
          }
        }
      }
    }

    // Format attendees with privacy (first name + last initial)
    const attendees = userActivities.map((ua) => {
      const user = ua.user
      const fullName = (user.firstName || user.name || '').trim()
      let displayName = 'Anonymous'

      if (fullName) {
        const parts = fullName.split(' ').filter(Boolean)
        if (parts.length >= 2) {
          displayName = `${parts[0]} ${parts[1][0]}.`
        } else if (parts.length === 1) {
          displayName = parts[0]
        }
      }

      return {
        id: user.id,
        name: displayName,
        imageUrl: user.imageUrl,
        bio: user.bio ? user.bio.slice(0, 100) : null,
        fitnessInterests: user.fitnessInterests,
        goingSolo: ua.goingSolo,
        isFollowing: followingSet.has(user.id),
        mutualEvents: mutualEventsMap.get(user.id) || [],
      }
    })

    // Total count including private profiles
    const totalCount = await prisma.userActivity.count({
      where: {
        activityId: eventId,
        status: 'JOINED',
        deletedAt: null,
      },
    })

    return NextResponse.json({ attendees, totalCount })
  } catch (error) {
    console.error('Error fetching attendee profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendee profiles' },
      { status: 500 }
    )
  }
}
