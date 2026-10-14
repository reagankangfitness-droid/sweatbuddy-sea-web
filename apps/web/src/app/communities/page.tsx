import { Metadata } from 'next'
import {
  getCitiesFromCommunityDirectory,
  getCommunityDirectory,
  getCommunityDirectorySubtitle,
} from '@/lib/community-directory'
import CommunitiesPageClient from './CommunitiesPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Run Clubs in Singapore',
  description: 'Find active Singapore run clubs you can confidently join, with source-checked schedules, social fit, and official joining links.',
  openGraph: {
    title: 'Run Clubs in Singapore',
    description: 'Find active Singapore run clubs through official links and source-checked pages.',
    url: 'https://www.sweatbuddies.co/communities',
  },
}

interface CommunitiesPageProps {
  searchParams: Promise<{
    city?: string
    q?: string
    fit?: string
    price?: string
    view?: string
  }>
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const communities = await getCommunityDirectory()
  const cities = getCitiesFromCommunityDirectory(communities)
  const { city, q, fit, price, view } = await searchParams

  const subtitle = getCommunityDirectorySubtitle(communities.length, cities)

  return (
    <CommunitiesPageClient
      communities={communities}
      cities={cities}
      subtitle={subtitle}
      initialCitySlug={city ?? null}
      initialSearchQuery={q ?? ''}
      initialFitFilter={fit ?? null}
      initialPriceFilter={price ?? null}
      initialView={view ?? null}
    />
  )
}
