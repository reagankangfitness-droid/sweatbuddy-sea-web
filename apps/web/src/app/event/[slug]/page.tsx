import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getFamiliarFaces, type FamiliarFace } from '@/lib/familiar-faces'
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

  // Query attendees, recap, and reviews separately (no Prisma relation defined)
  const [attendees, attendeeCount, recap, reviews] = await Promise.all([
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
    }),
    prisma.eventReview.findMany({
      where: {
        eventId: event.id,
        isPublished: true,
        isFlagged: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        rating: true,
        content: true,
        reviewerName: true,
        hostResponse: true,
        createdAt: true,
      },
    })
  ])

  // Compute review summary
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    : 0
  const ratingDistribution = {
    fiveStar: reviews.filter(r => r.rating === 5).length,
    fourStar: reviews.filter(r => r.rating === 4).length,
    threeStar: reviews.filter(r => r.rating === 3).length,
    twoStar: reviews.filter(r => r.rating === 2).length,
    oneStar: reviews.filter(r => r.rating === 1).length,
  }
  const reviewSummary = { totalReviews, averageRating, ratingDistribution }

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
    reviews: reviews.map(r => ({
      id: r.id,
      rating: r.rating,
      content: r.content,
      reviewerName: r.reviewerName,
      hostResponse: r.hostResponse,
      createdAt: r.createdAt.toISOString(),
    })),
    reviewSummary,
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

  // Familiar faces: people the user has previously attended events with
  let familiarFaces: FamiliarFace[] = []
  let communityFollowData: { communityId: string | null; isFollowing: boolean } = {
    communityId: null,
    isFollowing: false,
  }
  const { userId } = await auth()
  if (userId) {
    const dbUser = await prisma.user.findFirst({ where: { id: userId }, select: { id: true, email: true } })
    if (dbUser?.email) {
      const result = await getFamiliarFaces(dbUser.email, event.id)
      familiarFaces = result.familiarFaces
    }

    // Check if the organizer has a community and if the user follows it
    if (event.organizer) {
      const normalized = event.organizer.replace(/^@/, '').toLowerCase().trim()
      const community = await prisma.community.findFirst({
        where: { instagramHandle: { equals: normalized, mode: 'insensitive' } },
        select: { id: true },
      })
      if (community && dbUser) {
        communityFollowData.communityId = community.id
        const membership = await prisma.communityMember.findUnique({
          where: { communityId_userId: { communityId: community.id, userId: dbUser.id } },
        })
        communityFollowData.isFollowing = !!membership
      }
    }
  } else {
    // For unauthenticated users, still check if community exists to show the button
    if (event.organizer) {
      const normalized = event.organizer.replace(/^@/, '').toLowerCase().trim()
      const community = await prisma.community.findFirst({
        where: { instagramHandle: { equals: normalized, mode: 'insensitive' } },
        select: { id: true },
      })
      if (community) {
        communityFollowData.communityId = community.id
      }
    }
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
      address: { '@type': 'PostalAddress', addressLocality: `${event.location || 'Singapore'}`, addressCountry: `${event.location?.toLowerCase().includes('bangkok') ? 'TH' : 'SG'}` },
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
      <EventPageClient event={event} familiarFaces={familiarFaces} communityFollow={communityFollowData} />
    </>
  )
}
