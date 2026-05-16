import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sessions',
  description: 'Discover local fitness sessions, crews, and group workouts near you.',
  openGraph: {
    title: 'Sessions | SweatBuddies',
    description: 'Discover local fitness sessions, crews, and group workouts near you.',
  },
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
