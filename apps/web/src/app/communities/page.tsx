import { Metadata } from 'next'
import {
  getCitiesFromCommunityDirectory,
  getCommunityDirectory,
  getCommunityDirectorySubtitle,
} from '@/lib/community-directory'
import CommunitiesPageClient from './CommunitiesPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Fitness Communities',
  description: 'Find active fitness communities you can confidently join. Browse run clubs, yoga groups, pickleball, cycling, hiking, climbing, and social fitness communities.',
  openGraph: {
    title: 'Fitness Communities',
    description: 'Find active fitness communities you can confidently join through official links and source-checked pages.',
    url: 'https://www.sweatbuddies.co/communities',
  },
}

interface CommunitiesPageProps {
  searchParams: Promise<{
    city?: string
    q?: string
    category?: string
    fit?: string
    price?: string
    view?: string
  }>
}

export default async function CommunitiesPage({ searchParams }: CommunitiesPageProps) {
  const communities = await getCommunityDirectory()
  const cities = getCitiesFromCommunityDirectory(communities)
  const { city, q, category, fit, price, view } = await searchParams

  const subtitle = getCommunityDirectorySubtitle(communities.length, cities)

  return (
    <CommunitiesPageClient
      communities={communities}
      cities={cities}
      subtitle={subtitle}
      initialCitySlug={city ?? null}
      initialSearchQuery={q ?? ''}
      initialCategoryFilter={category ?? null}
      initialFitFilter={fit ?? null}
      initialPriceFilter={price ?? null}
      initialView={view ?? null}
    />
  )
}
