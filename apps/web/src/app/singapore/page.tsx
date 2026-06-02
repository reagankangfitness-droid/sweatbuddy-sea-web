import type { Metadata } from 'next'
import { CityLandingPage } from '@/components/landing/CityLandingPage'
import { singaporeLanding } from '@/lib/city-landing'

export const metadata: Metadata = {
  title: 'New to Singapore? Find Your First Fitness Crew',
  description:
    'New to Singapore? Find beginner-friendly run clubs, yoga groups, pickleball crews, and local fitness sessions where showing up alone is normal.',
  openGraph: {
    title: 'New to Singapore? Find Your First Fitness Crew | SweatBuddies',
    description:
      'Find local fitness sessions where newcomers are expected, hosts are clear, and meeting people starts with movement.',
    images: ['/images/cities/singapore.jpg'],
  },
}

export default function SingaporePage() {
  return <CityLandingPage {...singaporeLanding} />
}
