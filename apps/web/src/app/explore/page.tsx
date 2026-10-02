import type { Metadata } from 'next'
import CommunitiesPage from '../communities/page'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Explore Fitness Communities',
  description: 'Explore active fitness communities by map, activity, area, and first-timer fit.',
}

export default CommunitiesPage
