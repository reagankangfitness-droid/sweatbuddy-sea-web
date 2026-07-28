import { Metadata } from 'next'
import { getCommunityDirectory } from '@/lib/community-directory'
import SavedCommunitiesPageClient from './SavedCommunitiesPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saved Fitness Communities',
  description: 'Return to the fitness communities you saved on SweatBuddies and check their official join paths.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SavedCommunitiesPage() {
  const communities = await getCommunityDirectory()

  return <SavedCommunitiesPageClient communities={communities} />
}
