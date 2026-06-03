import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { bangkokLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'Find Friends Through Fitness in Bangkok',
  description:
    'Join social runs, pickleball games, yoga sessions, and fitness crews in Bangkok where movement gives everyone a reason to meet.',
  openGraph: {
    title: 'Find Friends Through Fitness in Bangkok | SweatBuddies',
    description:
      'Find local fitness crews in Bangkok where first-timers are welcome and meeting people starts with movement.',
    images: ['/images/cities/bangkok.jpg'],
  },
}

export default function BangkokPage() {
  return <CityLandingPage {...bangkokLanding} />
}
