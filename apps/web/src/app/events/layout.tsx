import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Events',
  description: 'Discover local fitness events, group workouts, and wellness activities near you.',
  openGraph: {
    title: 'Events | SweatBuddy',
    description: 'Discover local fitness events, group workouts, and wellness activities near you.',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
