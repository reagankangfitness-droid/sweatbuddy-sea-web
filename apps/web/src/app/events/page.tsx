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
      title: `${category.emoji} ${category.name} Communities Near You | SweatBuddies`,
      description: `Find ${category.name.toLowerCase()} communities and sessions near you. Browse upcoming plans, show up, and meet people through movement on SweatBuddies.`,
      openGraph: {
        title: `${category.name} Communities | SweatBuddies`,
        description: `Find ${category.name.toLowerCase()} communities and sessions near you. Show up and meet people through movement.`,
      },
    }
  }

  return {
    title: 'Local Fitness Communities Near You | SweatBuddies',
    description: 'Find friends through local fitness communities near you — run clubs, yoga groups, pickleball crews, HIIT sessions, and more.',
    openGraph: {
      title: 'Local Fitness Communities Near You | SweatBuddies',
      description: 'Find friends through local fitness communities near you — run clubs, yoga groups, pickleball crews, HIIT sessions, and more.',
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
