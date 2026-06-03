import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { singaporeLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'Find Friends Through Fitness in Singapore',
  description:
    'Join local run clubs, pickleball games, yoga groups, and social workouts in Singapore where movement gives everyone a reason to meet.',
  openGraph: {
    title: 'Find Friends Through Fitness in Singapore | SweatBuddies',
    description:
      'Find local fitness crews in Singapore where first-timers are welcome and meeting people starts with movement.',
    images: ['/images/cities/singapore.jpg'],
  },
}

export default function SingaporePage() {
  return <CityLandingPage {...singaporeLanding} />
}
