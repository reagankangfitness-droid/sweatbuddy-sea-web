import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { bangkokLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'New to Bangkok? Find Your First Fitness Crew',
  description:
    'New to Bangkok? Discover social runs, pickleball games, yoga sessions, and fitness crews that welcome first-timers.',
  openGraph: {
    title: 'New to Bangkok? Find Your First Fitness Crew | SweatBuddies',
    description:
      'Find Bangkok fitness crews where showing up alone feels normal and first-timers know what to expect.',
    images: ['/images/cities/bangkok.jpg'],
  },
}

export default function BangkokPage() {
  return <CityLandingPage {...bangkokLanding} />
}
