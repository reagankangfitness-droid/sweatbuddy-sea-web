import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getEventById } from '@/lib/events'

interface Props {
  params: Promise<{ id: string }>
}

const BASE_URL = 'https://www.sweatbuddies.co'

// Category emojis for OG images
const categoryEmojis: Record<string, string> = {
  'Run Club': '🏃',
  'Running': '🏃',
  'Yoga': '🧘',
  'HIIT': '🔥',
  'Bootcamp': '💪',
  'Dance': '💃',
  'Dance Fitness': '💃',
  'Combat': '🥊',
  'Outdoor': '🌳',
  'Outdoor Fitness': '🌳',
  'Hiking': '🥾',
  'Meditation': '🧘',
  'Breathwork': '🌬️',
}

// Generate dynamic metadata for social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const event = await getEventById(id)

  // Fallback metadata if event not found
  if (!event) {
    return {
      title: 'Event Not Found | SweatBuddies',
      description: 'This event could not be found on SweatBuddies.',
      openGraph: {
        title: 'Event Not Found | SweatBuddies',
        description: 'This event could not be found on SweatBuddies.',
        url: `${BASE_URL}/e/${id}`,
        siteName: 'SweatBuddies',
        type: 'website',
      },
    }
  }

  const emoji = categoryEmojis[event.category] || '✨'
  const title = `${event.name} | SweatBuddies`
  const description = event.description
    ? event.description.slice(0, 160)
    : `Join ${event.name} - ${emoji} ${event.category} every ${event.day} at ${event.time} in ${event.location}. Free fitness events in Singapore!`

  // Build OG image URL with event data
  const ogImageUrl = new URL('/api/og', BASE_URL)
  ogImageUrl.searchParams.set('title', event.name)
  ogImageUrl.searchParams.set('category', event.category)
  ogImageUrl.searchParams.set('day', event.day)
  ogImageUrl.searchParams.set('time', event.time)
  ogImageUrl.searchParams.set('location', event.location)
  ogImageUrl.searchParams.set('organizer', event.organizer || '')
  if (event.imageUrl) {
    ogImageUrl.searchParams.set('image', event.imageUrl)
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/e/${id}`,
      siteName: 'SweatBuddies',
      type: 'website',
      locale: 'en_SG',
      images: [
        {
          url: ogImageUrl.toString(),
          width: 1200,
          height: 630,
          alt: `${event.name} - ${event.category} event on SweatBuddies`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl.toString()],
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
    },
  }
}

// Short URL redirect for events
// /e/[id] -> /?event=[id]
export default async function EventShortUrl({ params }: Props) {
  const { id } = await params
  redirect(`/?event=${id}`)
}
