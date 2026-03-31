import { Metadata } from 'next'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import HubClient from './HubClient'

export const metadata: Metadata = {
  title: 'Hub | SweatBuddies',
  description: 'Manage your sessions and crew.',
}

export default async function HubPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/hub')

  const clerkUser = await currentUser()
  const email = clerkUser?.primaryEmailAddress?.emailAddress
  if (!email) redirect('/buddy')

  const dbUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, name: true },
  })
  if (!dbUser) redirect('/buddy')

  const now = new Date()
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  // Get communities where user is owner/admin
  const memberships = await prisma.communityMember.findMany({
    where: {
      userId,
      role: { in: ['OWNER', 'ADMIN'] },
      community: { isActive: true },
    },
    select: {
      community: {
        select: {
          id: true,
          name: true,
          slug: true,
          memberCount: true,
          category: true,
        },
      },
    },
  })

  // Also include communities created by this user (check both Clerk ID and DB ID)
  const owned = await prisma.community.findMany({
    where: {
      isActive: true,
      OR: [
        { createdById: userId },
        { createdById: dbUser.id },
        { claimedById: userId },
      ],
    },
    select: { id: true, name: true, slug: true, memberCount: true, category: true },
  })

  const allCommunities = new Map<string, typeof owned[0]>()
  for (const m of memberships) allCommunities.set(m.community.id, m.community)
  for (const c of owned) allCommunities.set(c.id, c)
  const communities = Array.from(allCommunities.values())

  if (communities.length === 0) {
    // Not a host — redirect to main feed
    redirect('/buddy')
  }

  const communityIds = communities.map((c) => c.id)

  // Get upcoming sessions for these communities
  const [upcomingSessions, recentAttendees] = await Promise.all([
    prisma.activity.findMany({
      where: {
        communityId: { in: communityIds },
        status: 'PUBLISHED',
        deletedAt: null,
        startTime: { gte: now, lte: twoWeeks },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        address: true,
        city: true,
        communityId: true,
        categorySlug: true,
        maxPeople: true,
        _count: { select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } } },
      },
      orderBy: { startTime: 'asc' },
      take: 10,
    }),
    // Get total active members across all communities (attended in last 30 days)
    prisma.userActivity.findMany({
      where: {
        activity: {
          communityId: { in: communityIds },
          startTime: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
        },
        status: { in: ['JOINED', 'COMPLETED'] },
      },
      select: { userId: true },
      distinct: ['userId'],
    }),
  ])

  const totalMembers = communities.reduce((sum, c) => sum + c.memberCount, 0)
  const activeThisMonth = recentAttendees.length

  return (
    <HubClient
      hostName={dbUser.name}
      communities={communities}
      upcomingSessions={upcomingSessions.map((s) => ({
        id: s.id,
        title: s.title,
        startTime: s.startTime?.toISOString() ?? null,
        address: s.address,
        city: s.city,
        communityId: s.communityId,
        categorySlug: s.categorySlug,
        maxPeople: s.maxPeople,
        goingCount: s._count.userActivities,
      }))}
      totalMembers={totalMembers}
      activeThisMonth={activeThisMonth}
    />
  )
}
