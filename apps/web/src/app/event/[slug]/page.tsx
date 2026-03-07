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

  // Query attendees and recap separately (no Prisma relation defined)
  const [attendees, attendeeCount, recap] = await Promise.all([
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
    }),
    prisma.eventRecap.findUnique({
      where: { eventSubmissionId: event.id },
      select: {
        recapText: true,
        photoUrl: true,
        publishedAt: true,
        attendeeCount: true,
      },
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
    recap: recap ? {
      recapText: recap.recapText,
      photoUrl: recap.photoUrl,
      publishedAt: recap.publishedAt.toISOString(),
      attendeeCount: recap.attendeeCount,
    } : null,
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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export default async function EventPage({ params }: PageProps) {
  const { slug } = await params
  const event = await getEvent(slug)

  if (!event) {
    notFound()
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.description || `${event.category} event hosted by ${event.organizer || 'SweatBuddies'}`,
    startDate: event.eventDate || undefined,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.location,
      address: { '@type': 'PostalAddress', addressLocality: 'Singapore', addressCountry: 'SG' },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizerName || 'SweatBuddies',
      url: BASE_URL,
    },
    image: event.imageUrl || `${BASE_URL}/images/og-image.jpg`,
    url: `${BASE_URL}/e/${event.slug || event.id}`,
    ...(event.isFree
      ? { isAccessibleForFree: true, offers: { '@type': 'Offer', price: 0, priceCurrency: 'SGD', availability: event.isFull ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } }
      : event.price
        ? { offers: { '@type': 'Offer', price: (event.price / 100).toFixed(2), priceCurrency: 'SGD', availability: event.isFull ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock' } }
        : {}),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EventPageClient event={event} />
    </>
  )
}
