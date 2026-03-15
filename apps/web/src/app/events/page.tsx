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
      title: `${category.emoji} ${category.name} Events Near You | SweatBuddies`,
      description: `Find ${category.name.toLowerCase()} events near you. ${category.description}. Browse upcoming sessions and join the community on SweatBuddies.`,
      openGraph: {
        title: `${category.name} Events | SweatBuddies`,
        description: `Discover ${category.name.toLowerCase()} events near you. ${category.description}`,
      },
    }
  }

  return {
    title: 'Fitness Events Near You | SweatBuddies',
    description: 'Discover fitness events near you — run clubs, yoga sessions, HIIT workouts, and more. Browse upcoming sessions and join the community.',
    openGraph: {
      title: 'Fitness Events Near You | SweatBuddies',
      description: 'Discover fitness events near you — run clubs, yoga sessions, HIIT workouts, and more. Browse upcoming sessions and join the community.',
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
