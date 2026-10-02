'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookmarkX, ChevronRight, Compass, Search } from 'lucide-react'
import type { CommunityData } from '@/app/communities/CommunitiesPageClient'
import { ProductNav } from '@/components/ProductNav'
import { LogoWithText } from '@/components/logo'
import { getCategoryEmoji } from '@/lib/categories'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'

const SAVED_KEY = 'sweatbuddies_saved_communities'

export default function SavedCommunitiesPageClient({ communities, embedded = false }: { communities: CommunityData[]; embedded?: boolean }) {
  const [savedSlugs, setSavedSlugs] = useState<string[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => { setSavedSlugs(readSavedSlugs()) }, [])

  const saved = useMemo(() => communities.filter((item) => savedSlugs.includes(item.slug) && item.name.toLowerCase().includes(query.toLowerCase())), [communities, savedSlugs, query])
  const suggestions = useMemo(() => communities.filter((item) => !savedSlugs.includes(item.slug)).slice(0, 3), [communities, savedSlugs])

  function remove(slug: string) {
    const next = savedSlugs.filter((item) => item !== slug)
    setSavedSlugs(next)
    window.localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  }

  return <main className={`${embedded ? '' : 'min-h-screen pb-28'} bg-[#F8F4EA] text-[#17130E]`}>
    {!embedded && <header className="border-b border-black/10 bg-[#F8F4EA] px-4 pb-5 pt-[max(16px,env(safe-area-inset-top))]">
      <div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><Link href="/"><LogoWithText size={25} color="#E8412C" textColor="#17130E" /></Link><Link href="/explore" className="text-sm font-bold text-[#E8412C]">Explore</Link></div><h1 className="mt-7 text-3xl font-bold text-[#17130E]">My communities</h1><p className="mt-1 text-sm text-black/55">Your shortlist and the groups you want to show up for.</p><label className="relative mt-5 block"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/40" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search my communities" className="h-12 w-full rounded-full border border-black/10 bg-white pl-12 pr-4 text-sm outline-none focus:border-[#E8412C]" /></label></div>
    </header>}
    <div className="mx-auto max-w-5xl px-4 py-6">
      {saved.length ? <section><div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-[#17130E]">Saved</h2><span className="text-xs text-black/45">{saved.length}</span></div><div className="space-y-3">{saved.map((community) => <SavedRow key={community.slug} community={community} onRemove={() => remove(community.slug)} />)}</div></section> : <section className="rounded-[2rem] border border-black/10 bg-white px-6 py-14 text-center shadow-sm"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#FDE6E1] text-[#E8412C]"><Compass className="h-7 w-7" /></span><h2 className="mt-5 text-xl font-bold text-[#17130E]">No communities saved yet</h2><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-black/55">Find a crew that matches how you like to move. Save it when you want to come back.</p><Link href="/explore" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#17130E] px-6 text-sm font-bold text-white">Explore communities <ArrowRight className="h-4 w-4" /></Link></section>}
      {suggestions.length > 0 && <section className="mt-8"><h2 className="text-lg font-bold text-[#17130E]">Good places to start</h2><p className="mt-1 text-sm text-black/50">Beginner-friendly communities in Singapore</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{suggestions.map((item) => <Suggestion key={item.slug} community={item} />)}</div></section>}
    </div>
    {!embedded && <ProductNav active="me" />}
  </main>
}

function SavedRow({ community, onRemove }: { community: CommunityData; onRemove: () => void }) {
  const image = community.logoImage || community.coverImage || getCategoryFallbackImage(community.category)
  return <article className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white p-3 shadow-sm"><Link href={`/communities/${community.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl"><Image src={image} alt={community.name} fill className="object-cover" unoptimized={!image.startsWith('/')} /></Link><Link href={`/communities/${community.slug}`} className="min-w-0 flex-1"><h3 className="truncate font-bold">{community.name}</h3><p className="mt-1 truncate text-xs text-black/50">{getCategoryEmoji(community.category)} {community.usualArea || community.cityName} · {community.usualSchedule || 'Schedule varies'}</p></Link><button type="button" onClick={onRemove} className="grid h-10 w-10 place-items-center rounded-full text-black/35" aria-label={`Remove ${community.name}`}><BookmarkX className="h-4 w-4" /></button><ChevronRight className="h-4 w-4 text-black/30" /></article>
}

function Suggestion({ community }: { community: CommunityData }) {
  const image = community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)
  return <Link href={`/communities/${community.slug}`} className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm"><div className="relative h-28"><Image src={image} alt={community.name} fill className="object-cover" unoptimized={!image.startsWith('/')} /></div><div className="p-3"><h3 className="truncate font-bold">{community.name}</h3><p className="mt-1 text-xs text-black/50">{getCategoryEmoji(community.category)} {community.usualArea || 'Singapore'}</p></div></Link>
}

function readSavedSlugs() {
  try { const value = window.localStorage.getItem(SAVED_KEY); const parsed = value ? JSON.parse(value) : []; return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [] } catch { return [] }
}
