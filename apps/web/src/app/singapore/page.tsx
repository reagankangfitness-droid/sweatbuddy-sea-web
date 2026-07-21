import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { FitnessDirectoryPage } from '@/components/fitness-directory/FitnessDirectoryPage'

export const metadata: Metadata = {
  title: 'Singapore Fitness Guide',
  description:
    'Discover gyms, studios, run clubs, outdoor fitness, sports facilities, reviews, photos, and communities in Singapore.',
  openGraph: {
    title: 'Singapore Fitness Guide',
    description:
      'Find where to train, play, and meet active people in Singapore.',
    images: ['/images/cities/singapore.jpg'],
  },
}

interface SingaporePageProps {
  searchParams: Promise<{
    q?: string
    area?: string
    vibe?: string
    beginner?: string
    trust?: string
    tab?: string
    view?: string
    type?: string
    date?: string
    city?: string
  }>
}

export default async function SingaporePage({ searchParams }: SingaporePageProps) {
  const params = await searchParams
  const city = params.city || 'singapore'

  if (params.tab === 'events') {
    const next = new URLSearchParams({ city })
    if (params.type) next.set('type', params.type)
    if (params.date) next.set('date', params.date)
    redirect(`/buddy?${next.toString()}`)
  }

  if (params.tab === 'communities') {
    redirect(`/communities?city=${encodeURIComponent(city)}`)
  }

  if (params.tab === 'map' || params.view === 'map') {
    const next = new URLSearchParams({ view: 'map', city })
    if (params.type) next.set('type', params.type)
    if (params.date) next.set('date', params.date)
    redirect(`/buddy?${next.toString()}`)
  }

  return <FitnessDirectoryPage categorySlug="fitness" searchParams={params} />
}
