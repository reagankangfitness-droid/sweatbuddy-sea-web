import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { singaporeLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'Show Up Alone. Leave With Familiar Faces in Singapore',
  description:
    'Find solo-friendly run clubs, pickleball games, yoga groups, and social workouts in Singapore where people actually expect to meet.',
  openGraph: {
    title: 'Show Up Alone. Leave With Familiar Faces in Singapore | SweatBuddies',
    description:
      'Find solo-friendly fitness crews in Singapore where first-timers are welcome and meeting people starts with movement.',
    images: ['/images/cities/singapore.jpg'],
  },
}

export default function SingaporePage() {
  return <CityLandingPage {...singaporeLanding} />
}
