import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/communities — Get communities the current user follows
 */
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const memberships = await prisma.communityMember.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              instagram: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })

  // For each community, get the next upcoming event
  const communities = await Promise.all(
    memberships.map(async (m) => {
      // Try to get next event from EventSubmission (via instagram handle)
      let nextEvent = null
      if (m.community.instagramHandle) {
        const normalized = m.community.instagramHandle.toLowerCase()
        const withAt = `@${normalized}`
        const submission = await prisma.eventSubmission.findFirst({
          where: {
            organizerInstagram: { in: [normalized, withAt], mode: 'insensitive' },
            status: 'APPROVED',
            eventDate: { gte: new Date() },
            cancelledAt: null,
          },
          orderBy: { eventDate: 'asc' },
          select: {
            id: true,
            eventName: true,
            eventDate: true,
            time: true,
            slug: true,
          },
        })
        if (submission) {
          nextEvent = {
            id: submission.id,
            name: submission.eventName,
            date: submission.eventDate?.toISOString() || null,
            time: submission.time,
            href: `/e/${submission.slug || submission.id}`,
          }
        }
      }

      // Fallback: check Activity events
      if (!nextEvent) {
        const activity = await prisma.activity.findFirst({
          where: {
            communityId: m.community.id,
            status: 'PUBLISHED',
            startTime: { gte: new Date() },
          },
          orderBy: { startTime: 'asc' },
          select: {
            id: true,
            title: true,
            startTime: true,
          },
        })
        if (activity) {
          nextEvent = {
            id: activity.id,
            name: activity.title,
            date: activity.startTime?.toISOString() || null,
            time: null,
            href: `/activities/${activity.id}`,
          }
        }
      }

      return {
        id: m.community.id,
        name: m.community.name,
        slug: m.community.slug,
        category: m.community.category,
        logoImage: m.community.logoImage,
        hostName: m.community.createdBy?.name || m.community.name,
        hostImageUrl: m.community.createdBy?.imageUrl || null,
        instagramHandle: m.community.instagramHandle,
        role: m.role,
        nextEvent,
      }
    })
  )

  return NextResponse.json({ communities })
}
