import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.primaryEmailAddress?.emailAddress
    if (!email) {
      return NextResponse.json({ error: 'No email found' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    })

    if (!dbUser) {
      return NextResponse.json({ upcoming: [], past: [] })
    }

    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const statusFilter: ('JOINED' | 'COMPLETED')[] = ['JOINED', 'COMPLETED']

    const sessionSelect = {
      id: true,
      title: true,
      imageUrl: true,
      categorySlug: true,
      startTime: true,
      endTime: true,
      address: true,
      city: true,
      latitude: true,
      longitude: true,
      userId: true,
      user: {
        select: { id: true, name: true, imageUrl: true },
      },
      community: {
        select: { id: true, name: true, slug: true, logoImage: true },
      },
      userActivities: {
        where: { status: { in: statusFilter } },
        select: { id: true },
      },
    }

    // Fetch hosting + attending in parallel for both upcoming and past
    const [upcomingHosting, upcomingAttending, pastHosting, pastAttending] = await Promise.all([
      // Upcoming sessions user is hosting
      prisma.activity.findMany({
        where: {
          userId: dbUser.id,
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          startTime: { gt: now },
          deletedAt: null,
        },
        select: sessionSelect,
        orderBy: { startTime: 'asc' },
      }),
      // Upcoming sessions user is attending (not hosting)
      prisma.userActivity.findMany({
        where: {
          userId: dbUser.id,
          status: { in: ['JOINED', 'COMPLETED'] },
          activity: {
            activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
            userId: { not: dbUser.id },
            startTime: { gt: now },
            deletedAt: null,
          },
        },
        select: {
          activity: { select: sessionSelect },
        },
      }),
      // Past sessions user hosted (last 7 days)
      prisma.activity.findMany({
        where: {
          userId: dbUser.id,
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          startTime: { gte: sevenDaysAgo, lte: now },
          deletedAt: null,
        },
        select: sessionSelect,
        orderBy: { startTime: 'desc' },
        take: 10,
      }),
      // Past sessions user attended (last 7 days)
      prisma.userActivity.findMany({
        where: {
          userId: dbUser.id,
          status: { in: ['JOINED', 'COMPLETED'] },
          activity: {
            activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
            userId: { not: dbUser.id },
            startTime: { gte: sevenDaysAgo, lte: now },
            deletedAt: null,
          },
        },
        select: {
          activity: { select: sessionSelect },
        },
        orderBy: { activity: { startTime: 'desc' } },
        take: 10,
      }),
    ])

    const formatSession = (activity: typeof upcomingHosting[number], userStatus: 'JOINED' | 'HOSTING') => ({
      id: activity.id,
      title: activity.title,
      imageUrl: activity.imageUrl,
      categorySlug: activity.categorySlug,
      startTime: activity.startTime,
      endTime: activity.endTime,
      address: activity.address,
      city: activity.city,
      latitude: activity.latitude,
      longitude: activity.longitude,
      host: { name: activity.user.name, imageUrl: activity.user.imageUrl },
      community: activity.community
        ? { name: activity.community.name, slug: activity.community.slug, logoImage: activity.community.logoImage }
        : null,
      attendeeCount: activity.userActivities.length,
      userStatus,
    })

    const upcoming = [
      ...upcomingHosting.map((a) => formatSession(a, 'HOSTING')),
      ...upcomingAttending.map((ua) => formatSession(ua.activity, 'JOINED')),
    ].sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime())

    const past = [
      ...pastHosting.map((a) => formatSession(a, 'HOSTING')),
      ...pastAttending.map((ua) => formatSession(ua.activity, 'JOINED')),
    ]
      .sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())
      .slice(0, 10)

    return NextResponse.json({ upcoming, past })
  } catch (error) {
    console.error('[buddy/sessions/mine] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
