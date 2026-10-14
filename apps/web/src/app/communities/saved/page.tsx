import { Metadata } from 'next'
import { getCommunityDirectory } from '@/lib/community-directory'
import SavedCommunitiesPageClient from './SavedCommunitiesPageClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Saved Run Clubs & Caliversity',
  description: 'Return to the Singapore run clubs and Caliversity listing you saved on SweatBuddies.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SavedCommunitiesPage() {
  const communities = await getCommunityDirectory()

  return <SavedCommunitiesPageClient communities={communities} />
}
