import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Explore fitness activities and events happening in your neighborhood.',
  openGraph: {
    title: 'Explore | SweatBuddy',
    description: 'Explore fitness activities and events happening in your neighborhood.',
  },
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children
}
