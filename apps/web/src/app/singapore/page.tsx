import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { singaporeLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'Run Clubs & Caliversity in Singapore | SweatBuddies',
  description:
    'Find source-checked Singapore run clubs and Caliversity with official joining paths.',
  openGraph: {
    title: 'Run Clubs & Caliversity in Singapore | SweatBuddies',
    description:
      'Find local run clubs and Caliversity where first-timers are welcome and meeting people starts with movement.',
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
    const next = new URLSearchParams({ view: 'list', city })
    if (params.type) next.set('type', params.type)
    if (params.date) next.set('date', params.date)
    redirect(`/this-week?${next.toString()}`)
  }

  if (params.tab === 'communities') {
    redirect(`/explore?city=${encodeURIComponent(city)}`)
  }

  if (params.tab === 'map' || params.view === 'map') {
    const next = new URLSearchParams({ view: 'map', city })
    if (params.type) next.set('type', params.type)
    if (params.date) next.set('date', params.date)
    redirect(`/explore?city=${encodeURIComponent(city)}`)
  }

  return <CityLandingPage {...singaporeLanding} />
}
