import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { EventPageClient } from './EventPageClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getEvent(slug: string) {
  // Try to find by slug first, then by ID
  const event = await prisma.eventSubmission.findFirst({
    where: {
      OR: [
        { slug: slug },
        { id: slug }
      ],
      status: 'APPROVED'
    }
  })

  if (!event) return null

  // Query attendees separately (no Prisma relation defined)
  const [attendees, attendeeCount] = await Promise.all([
    prisma.eventAttendance.findMany({
      where: {
        eventId: event.id,
        confirmed: true
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
      }
    }),
    prisma.eventAttendance.count({
      where: {
        eventId: event.id,
        confirmed: true
      }
    })
  ])

  return {
    id: event.id,
    slug: event.slug,
    name: event.eventName,
    category: event.category,
    day: event.day,
    eventDate: event.eventDate?.toISOString() || null,
    time: event.time,
    location: event.location,
    latitude: event.latitude,
    longitude: event.longitude,
    description: event.description,
    organizer: event.organizerInstagram || event.organizerName,
    organizerName: event.organizerName,
    imageUrl: event.imageUrl,
    communityLink: event.communityLink,
    recurring: event.recurring,
    goingCount: attendeeCount,
    isFull: event.isFull,
    isFree: event.isFree,
    price: event.price,
    paynowEnabled: event.paynowEnabled,
    paynowQrCode: event.paynowQrCode,
    paynowNumber: event.paynowNumber,
    attendeesPreview: attendees.map(a => ({
      id: a.id,
      name: a.name || 'Anonymous',
    })),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    return { title: 'Event Not Found' }
  }

  return {
    title: `${event.name} | SweatBuddies`,
    description: event.description || `Join ${event.organizer} for ${event.name} at ${event.location}`,
    openGraph: {
      title: event.name,
      description: event.description || `${event.day} · ${event.time} · ${event.location}`,
      images: event.imageUrl ? [{ url: event.imageUrl }] : [],
    },
  }
}

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  return <EventPageClient event={event} />
}
