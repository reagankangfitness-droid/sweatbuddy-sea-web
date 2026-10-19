import type { Metadata } from 'next'
import GymResearchForm from './GymResearchForm'

export const metadata: Metadata = {
  title: 'Help us understand how people choose gyms | SweatBuddies',
  description: 'A short research questionnaire for people who recently joined, switched, cancelled, or compared gyms in Singapore.',
  robots: { index: false, follow: false },
}

export default function GymResearchPage() {
  return <GymResearchForm />
}
