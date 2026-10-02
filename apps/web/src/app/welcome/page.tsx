import type { Metadata } from 'next'
import HomePage from '../page'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'SweatBuddies - Fitness Communities You Can Actually Join',
  description:
    'Find active fitness communities near you by area, vibe, schedule, and beginner-friendliness.',
}

export default function WelcomePage() {
  return <HomePage searchParams={Promise.resolve({ welcome: '1' })} />
}
