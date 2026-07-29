import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Communities | SweatBuddies',
  description: 'Discover verified fitness communities and joinable workout plans.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function PlacePage() {
  redirect('/communities?city=singapore')
}
