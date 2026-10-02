import type { Metadata } from 'next'
import Link from 'next/link'
import { getCommunityDirectory } from '@/lib/community-directory'
import { LogoWithText } from '@/components/logo'
import { ProductNav } from '@/components/ProductNav'
import SavedCommunitiesPageClient from '@/app/communities/saved/SavedCommunitiesPageClient'
import MySessionsPage from '@/app/my-sessions/page'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Activity', robots: { index: false, follow: false } }

export default async function MePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'communities' } = await searchParams
  const communities = tab === 'communities' ? await getCommunityDirectory() : []

  return (
    <main className="min-h-screen bg-[#F8F4EA] pb-24 text-[#17130E]">
      <header className="border-b border-black/10 px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between"><Link href="/"><LogoWithText size={25} color="#E8412C" textColor="#17130E" /></Link><Link href="/profile" className="text-sm font-bold text-[#E8412C]">Profile</Link></div>
          <h1 className="mt-7 text-3xl font-bold text-[#17130E]">My activity</h1>
          <p className="mt-1 text-sm text-black/55">Communities you saved and sessions you joined.</p>
          <nav className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-black/[0.05] p-1" aria-label="My activity sections">
            {[['communities', 'Communities'], ['upcoming', 'Upcoming'], ['past', 'Past']].map(([key, label]) => <Link key={key} href={`/me?tab=${key}`} className={`rounded-xl px-3 py-2.5 text-center text-xs font-bold ${tab === key ? 'bg-white text-[#17130E] shadow-sm' : 'text-black/45'}`}>{label}</Link>)}
          </nav>
        </div>
      </header>
      {tab === 'communities' ? (
        <SavedCommunitiesPageClient communities={communities} embedded />
      ) : (
        <MySessionsPage section={tab === 'past' ? 'past' : 'upcoming'} embedded />
      )}
      <ProductNav active="me" />
    </main>
  )
}
