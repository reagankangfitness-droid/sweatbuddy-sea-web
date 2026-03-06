import { prisma } from '@/lib/prisma'
import { LandingPage as LandingClient } from '@/components/landing/LandingPage'

export const revalidate = 300 // ISR: revalidate every 5 minutes

async function getLandingData() {
  const now = new Date()

  // Count approved events & distinct hosts
  const [eventCount, hostCount, upcomingEvents] = await Promise.all([
    prisma.eventSubmission.count({
      where: { status: 'APPROVED' },
    }),
    prisma.eventSubmission
      .findMany({
        where: { status: 'APPROVED' },
        select: { organizerInstagram: true },
        distinct: ['organizerInstagram'],
      })
      .then((rows) => rows.length),
    prisma.eventSubmission.findMany({
      where: {
        status: 'APPROVED',
        eventDate: { gte: now },
        OR: [
          { scheduledPublishAt: null },
          { scheduledPublishAt: { lte: now } },
        ],
      },
      orderBy: { eventDate: 'asc' },
      take: 4,
      select: {
        id: true,
        slug: true,
        eventName: true,
        category: true,
        eventDate: true,
        time: true,
        location: true,
        imageUrl: true,
        organizerName: true,
        organizerInstagram: true,
        isFree: true,
        price: true,
        currency: true,
      },
    }),
  ])

  return {
    eventCount,
    hostCount,
    upcomingEvents: upcomingEvents.map((e) => ({
      id: e.id,
      slug: e.slug,
      eventName: e.eventName,
      category: e.category,
      eventDate: e.eventDate?.toISOString() || null,
      time: e.time,
      location: e.location,
      imageUrl: e.imageUrl,
      organizerName: e.organizerName,
      isFree: e.isFree,
      price: e.price,
      currency: e.currency,
    })),
  }
}

export default async function LandingPage() {
  const data = await getLandingData()

  return <LandingClient data={data} />
}
