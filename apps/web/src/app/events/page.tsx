import { Metadata } from 'next'
import { Suspense } from 'react'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'
import EventsPageClient from './EventsPageClient'

interface Props {
  searchParams: Promise<{ cat?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { cat } = await searchParams
  const category = cat ? ACTIVITY_CATEGORIES.find((c) => c.slug === cat) : null

  if (category) {
    return {
      title: `${category.emoji} ${category.name} Events in Singapore`,
      description: `Find ${category.name.toLowerCase()} events near you. ${category.description}. Browse upcoming sessions and join the community on SweatBuddies.`,
      openGraph: {
        title: `${category.name} Events | SweatBuddies`,
        description: `Discover ${category.name.toLowerCase()} events in Singapore. ${category.description}`,
      },
    }
  }

  return {
    title: 'Events | SweatBuddies',
    description: 'Discover fitness events near you — running clubs, yoga sessions, HIIT workouts, and more. Browse upcoming events and join the SweatBuddies community.',
    openGraph: {
      title: 'Events | SweatBuddies',
      description: 'Discover fitness events near you — running clubs, yoga, HIIT, and more.',
    },
  }
}

export default function EventsPage() {
  return (
    <Suspense>
      <EventsPageClient />
    </Suspense>
  )
}
