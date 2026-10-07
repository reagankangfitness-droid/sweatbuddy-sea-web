import type { Metadata } from 'next'
import Link from 'next/link'
import { getCommunityDirectory } from '@/lib/community-directory'
import { LogoWithText } from '@/components/logo'
import { ProductHeader, ProductNav } from '@/components/ProductNav'
import SavedCommunitiesPageClient from '@/app/communities/saved/SavedCommunitiesPageClient'
import MySessionsPage from '@/app/my-sessions/page'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'My Activity', robots: { index: false, follow: false } }

export default async function MePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = 'communities' } = await searchParams
  const communities = tab === 'communities' ? await getCommunityDirectory() : []

  return (
    <main className="min-h-screen bg-[#F8F4EA] pb-24 text-[#17130E]">
      <ProductHeader active="me" />
      <header className="border-b border-black/10 px-4 pb-4 pt-[max(16px,env(safe-area-inset-top))]">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between md:hidden"><Link href="/"><LogoWithText size={25} color="#E83E6B" textColor="#17130E" /></Link><Link href="/profile" className="text-sm font-bold text-[#E83E6B]">Profile</Link></div>
          <h1 className="sb-type-page-title mt-7 text-[#17130E]">My activity</h1>
          <p className="sb-type-body mt-1 text-black/55">Communities you saved and sessions you joined.</p>
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
