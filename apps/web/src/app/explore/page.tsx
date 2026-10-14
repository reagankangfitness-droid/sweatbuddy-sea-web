import type { Metadata } from 'next'
import CommunitiesPage from '../communities/page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Explore Run Clubs & Caliversity',
  description: 'Explore source-checked Singapore run clubs and Caliversity by map, area, schedule, and first-timer fit.',
}

export default CommunitiesPage
