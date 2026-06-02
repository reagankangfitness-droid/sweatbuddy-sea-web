import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { bangkokLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'Find Social Fitness Crews in Bangkok Without Buried Group Chats',
  description:
    'Find solo-friendly social runs, pickleball games, yoga sessions, and fitness crews in Bangkok with clear first-timer context.',
  openGraph: {
    title: 'Find Social Fitness Crews in Bangkok Without Buried Group Chats | SweatBuddies',
    description:
      'Find Bangkok fitness crews where showing up alone feels normal and first-timers know what to expect.',
    images: ['/images/cities/bangkok.jpg'],
  },
}

export default function BangkokPage() {
  return <CityLandingPage {...bangkokLanding} />
}
