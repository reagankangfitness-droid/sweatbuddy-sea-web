'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  List,
  Map as MapIcon,
  MapPin,
  Search,
  UserRound,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { ACTIVITY_CATEGORIES, getCategoryEmoji } from '@/lib/categories'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'
import { ProductHeader, ProductNav } from '@/components/ProductNav'
import {
  LazySessionVectorMap,
  type SessionVectorMapPin,
} from '@/components/maps/LazySessionVectorMap'

export interface CommunityMemberData { id: string; name: string | null; imageUrl: string | null }
export interface NextEventData { id: string; title: string; startTime: string; categorySlug: string | null }
export interface CommunityData {
  id: string
  name: string
  slug: string
  description: string | null
  coverImage: string | null
  logoImage: string | null
  category: string
  isVerified: boolean
  memberCount: number
  eventCount: number
  cityName: string | null
  citySlug: string | null
  latitude?: number | null
  longitude?: number | null
  usualArea: string | null
  usualSchedule: string | null
  joinPlatform: string | null
  communityLink: string | null
  websiteUrl?: string | null
  sourceUrl: string | null
  sourceLabel?: string | null
  bestFor?: string | null
  soloFriendly?: boolean
  confidenceScore?: number | null
  confidenceTier?: string | null
  vibeTags: string[]
  priceType: string | null
  beginnerFriendly: boolean
  lastVerifiedAt: string | null
  creatorName: string | null
  creatorImageUrl: string | null
  members: CommunityMemberData[]
  nextEvent: NextEventData | null
  _count: { members: number; activities: number }
}
export interface CityData { name: string; slug: string; communityCount: number }

interface Props {
  communities: CommunityData[]
  cities: CityData[]
  subtitle: string
  initialCitySlug?: string | null
  initialSearchQuery?: string
  initialCategoryFilter?: string | null
  initialFitFilter?: string | null
  initialPriceFilter?: string | null
  initialView?: string | null
}

const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  singapore: { lat: 1.3521, lng: 103.8198 },
  bangkok: { lat: 13.7563, lng: 100.5018 },
}

function categoryName(slug: string) {
  return ACTIVITY_CATEGORIES.find((item) => item.slug === slug)?.name
    ?? slug.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function priceLabel(value: string | null) {
  if (!value) return 'Price varies'
  if (value === 'free_paid' || value === 'mixed') return 'Free + paid'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function nextDate(value: string) {
  const date = new Date(value)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'Today'
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return date.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric' })
}

export default function CommunitiesPageClient({
  communities,
  cities,
  initialCitySlug = null,
  initialSearchQuery = '',
  initialCategoryFilter = null,
  initialFitFilter = null,
  initialPriceFilter = null,
  initialView = null,
}: Props) {
  const [query, setQuery] = useState(initialSearchQuery)
  const [category, setCategory] = useState<string | null>(initialCategoryFilter)
  const [city, setCity] = useState<string | null>(initialCitySlug)
  const [beginnerOnly, setBeginnerOnly] = useState(initialFitFilter === 'beginner')
  const [soloOnly, setSoloOnly] = useState(initialFitFilter === 'solo')
  const [freeOnly, setFreeOnly] = useState(initialPriceFilter === 'free')
  const [view, setView] = useState<'map' | 'list'>(initialView === 'list' ? 'list' : 'map')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const categories = useMemo(() => [...new Set(communities.map((item) => item.category))], [communities])
  const filtered = useMemo(() => communities.filter((item) => {
    const match = `${item.name} ${item.category} ${item.usualArea ?? ''} ${item.bestFor ?? ''}`.toLowerCase()
    return (!query.trim() || match.includes(query.toLowerCase()))
      && (!category || item.category === category)
      && (!city || item.citySlug === city)
      && (!beginnerOnly || item.beginnerFriendly)
      && (!soloOnly || item.soloFriendly)
      && (!freeOnly || item.priceType === 'free')
  }), [communities, query, category, city, beginnerOnly, soloOnly, freeOnly])
  const selected = filtered.find((item) => item.slug === selectedSlug) ?? null
  const mapCenter = CITY_CENTERS[city ?? selected?.citySlug ?? 'singapore'] ?? CITY_CENTERS.singapore
  const communityPins = useMemo<SessionVectorMapPin[]>(() => filtered.map((item) => ({
    id: `community:${item.slug}`,
    title: item.name,
    kind: 'community',
    markerVariant: 'community',
    latitude: item.latitude,
    longitude: item.longitude,
    city: item.cityName,
    primaryLabel: categoryName(item.category),
    activityLabel: `${getCategoryEmoji(item.category)} ${categoryName(item.category)}`,
    previewTitle: item.name,
    previewSubtitle: item.usualArea || item.cityName || 'Singapore',
    previewMeta: [item.usualSchedule, item.beginnerFriendly ? 'First-timer friendly' : null]
      .filter(Boolean)
      .join(' · '),
    previewImage: item.coverImage || item.logoImage || getCategoryFallbackImage(item.category),
    previewCtaLabel: 'View community',
  })), [filtered])

  useEffect(() => {
    const params = new URLSearchParams()
    if (query.trim()) params.set('q', query.trim())
    if (city) params.set('city', city)
    if (category) params.set('category', category)
    if (beginnerOnly) params.set('fit', 'beginner')
    else if (soloOnly) params.set('fit', 'solo')
    if (freeOnly) params.set('price', 'free')
    if (view !== 'map') params.set('view', view)
    const next = params.toString() ? `${pathname}?${params}` : pathname
    const timer = window.setTimeout(() => router.replace(next, { scroll: false }), 200)
    return () => window.clearTimeout(timer)
  }, [query, city, category, beginnerOnly, soloOnly, freeOnly, view, pathname, router])

  useEffect(() => {
    if (selectedSlug && !filtered.some((item) => item.slug === selectedSlug)) setSelectedSlug(null)
  }, [filtered, selectedSlug])

  function clearFilters() {
    setQuery('')
    setCategory(null)
    setCity(null)
    setBeginnerOnly(false)
    setSoloOnly(false)
    setFreeOnly(false)
    setSelectedSlug(null)
  }

  return (
    <main className="min-h-screen bg-[#F8F4EA] text-[#17130E]">
      <div className="md:hidden">
        <header className="sticky top-0 z-50 border-b border-black/10 bg-[#F8F4EA]/95 px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-xl">
          <div className="flex h-12 items-center justify-between">
            <Link href="/" aria-label="SweatBuddies home"><LogoWithText size={25} color="#E83E6B" textColor="#17130E" /></Link>
            <div className="flex items-center gap-1">
              <Link href="/notifications" aria-label="Notifications" className="grid h-11 w-11 place-items-center rounded-full"><Bell className="h-5 w-5" /></Link>
              <Link href="/profile" aria-label="Profile" className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-sm"><UserRound className="h-5 w-5" /></Link>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/45" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communities or activities" className="h-12 w-full rounded-full border border-black/10 bg-white pl-12 pr-4 text-sm outline-none focus:border-[#E83E6B]" />
            </label>
            <button type="button" onClick={() => setView(view === 'map' ? 'list' : 'map')} className="grid h-12 w-12 place-items-center rounded-full bg-[#17130E] text-white" aria-label={`Switch to ${view === 'map' ? 'list' : 'map'} view`}>
              {view === 'map' ? <List className="h-5 w-5" /> : <MapIcon className="h-5 w-5" />}
            </button>
          </div>
        </header>

        <div className="sticky top-[88px] z-40 overflow-x-auto border-b border-black/10 bg-[#F8F4EA] px-4 py-3 [scrollbar-width:none]">
          <div className="flex w-max gap-2">
            <FilterChip active={!category} onClick={() => setCategory(null)}>All <span className="opacity-55">{communities.length}</span></FilterChip>
            {categories.slice(0, 6).map((item) => <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{getCategoryEmoji(item)} {categoryName(item)}</FilterChip>)}
            <FilterChip active={beginnerOnly} onClick={() => { setBeginnerOnly(!beginnerOnly); setSoloOnly(false) }}>First-timer friendly</FilterChip>
            <FilterChip active={soloOnly} onClick={() => { setSoloOnly(!soloOnly); setBeginnerOnly(false) }}>Solo-friendly</FilterChip>
            <FilterChip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Free</FilterChip>
            <Link href="/communities/nominate" className="flex h-10 items-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 text-sm font-semibold text-[#E83E6B]">Suggest a community</Link>
          </div>
        </div>

        {view === 'map' ? (
          <section className="relative h-[calc(100dvh-193px)] min-h-[520px] overflow-hidden bg-[#F4EFE3] pb-44">
            <LazySessionVectorMap
              className="community-directory-map absolute inset-0"
              center={mapCenter}
              pins={communityPins}
              selectedPinId={selected ? `community:${selected.slug}` : null}
              onPinClick={(pin) => setSelectedSlug(pin?.id.replace('community:', '') ?? null)}
              onMapClick={() => setSelectedSlug(null)}
              initialZoom={11.2}
              maxFitZoom={13}
              fitPadding={58}
              showControls
            />
            <label className="absolute left-4 top-4 flex items-center rounded-full bg-white/95 px-4 py-2 text-xs font-semibold shadow-lg">
              <MapPin className="mr-1 h-4 w-4 text-[#E83E6B]" />
              <select aria-label="Choose city" value={city ?? ''} onChange={(event) => { setCity(event.target.value || null); setSelectedSlug(null) }} className="appearance-none bg-transparent pr-5 font-semibold outline-none">
                <option value="">All cities</option>
                {cities.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({item.communityCount})</option>)}
              </select>
              <ChevronDown className="pointer-events-none -ml-4 h-3.5 w-3.5" />
            </label>
            <div className="absolute right-4 top-4 rounded-full bg-[#17130E]/88 px-3 py-2 text-xs font-bold text-white shadow-lg">{filtered.length} found</div>
            {selected && <div className="absolute inset-x-3 bottom-24 z-30"><CommunitySpotlight community={selected} /></div>}
            {!selected && filtered.length > 0 && <div className="absolute inset-x-4 bottom-24 z-20 rounded-2xl bg-white/95 px-4 py-3 text-center text-sm font-semibold shadow-lg">Tap a marker to preview a community</div>}
            {filtered.length === 0 && <EmptyResults onClear={clearFilters} compact />}
          </section>
        ) : (
          <section className="px-4 pb-28 pt-5">
            <div className="mb-4 flex items-end justify-between"><div><p className="text-2xl font-bold">{filtered.length} communities</p><p className="mt-1 text-sm text-black/55">Active groups with checked join paths</p></div><Link href="/communities/nominate" className="text-xs font-bold text-[#E83E6B]">Suggest one</Link></div>
            {filtered.length ? <div className="space-y-3">{filtered.map((item) => <CommunityRow key={item.slug} community={item} />)}</div> : <EmptyResults onClear={clearFilters} />}
          </section>
        )}
        <ProductNav active="explore" />
      </div>

      <div className="hidden md:block">
        <ProductHeader active="explore" />
        <section className="mx-auto max-w-6xl px-6 py-10">
          <p className="sb-eyebrow">Explore fitness communities</p>
          <div className="mt-3 flex items-end justify-between gap-8">
            <h1 className="sb-type-page-title max-w-2xl text-[#17130E]">Find a group that makes showing up easier.</h1>
            <p className="sb-type-body max-w-sm text-black/55">Browse active communities by activity, area, schedule, and first-timer fit.</p>
          </div>
          <div className="mt-8 flex items-center gap-3">
            <label className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/45" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search communities or activities" className="h-12 w-full rounded-full border border-black/10 bg-white pl-12 pr-4 text-sm outline-none focus:border-[#E83E6B]" />
            </label>
            <button type="button" onClick={() => setView('map')} className={`h-12 rounded-full px-5 text-sm font-bold ${view === 'map' ? 'bg-[#17130E] text-white' : 'border border-black/10 bg-white'}`}>Map</button>
            <button type="button" onClick={() => setView('list')} className={`h-12 rounded-full px-5 text-sm font-bold ${view === 'list' ? 'bg-[#17130E] text-white' : 'border border-black/10 bg-white'}`}>List</button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={!category} onClick={() => setCategory(null)}>All {communities.length}</FilterChip>
            {categories.map((item) => <FilterChip key={item} active={category === item} onClick={() => setCategory(item)}>{getCategoryEmoji(item)} {categoryName(item)}</FilterChip>)}
            <FilterChip active={beginnerOnly} onClick={() => { setBeginnerOnly(!beginnerOnly); setSoloOnly(false) }}>First-timer friendly</FilterChip>
            <FilterChip active={soloOnly} onClick={() => { setSoloOnly(!soloOnly); setBeginnerOnly(false) }}>Solo-friendly</FilterChip>
            <FilterChip active={freeOnly} onClick={() => setFreeOnly(!freeOnly)}>Free</FilterChip>
          </div>
          {view === 'map' ? (
            <div className="mt-6 grid h-[610px] grid-cols-[minmax(300px,360px)_1fr] overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-sm">
              <aside className="overflow-y-auto border-r border-black/10 p-4">
                <div className="mb-4 flex items-center justify-between"><div><p className="text-lg font-bold">{filtered.length} communities</p><p className="text-xs text-black/50">Choose one to see it on the map</p></div><Link href="/communities/nominate" className="text-xs font-bold text-[#E83E6B]">Suggest one</Link></div>
                {filtered.length ? <div className="space-y-3">{filtered.map((item) => <CommunityMapResult key={item.slug} community={item} active={selectedSlug === item.slug} onSelect={() => setSelectedSlug(item.slug)} />)}</div> : <EmptyResults onClear={clearFilters} />}
              </aside>
              <div className="relative min-w-0 bg-[#F4EFE3]">
                <LazySessionVectorMap className="community-directory-map" center={mapCenter} pins={communityPins} selectedPinId={selected ? `community:${selected.slug}` : null} onPinClick={(pin) => setSelectedSlug(pin?.id.replace('community:', '') ?? null)} onMapClick={() => setSelectedSlug(null)} initialZoom={11.2} maxFitZoom={13} fitPadding={84} showControls />
                {selected && <div className="absolute bottom-5 left-5 z-30 w-[380px]"><CommunitySpotlight community={selected} /></div>}
              </div>
            </div>
          ) : (
            filtered.length ? <div className="mt-8 grid grid-cols-3 gap-5 text-[#17130E] [&_h2]:!text-[#17130E]">{filtered.map((item) => <CommunityRow key={item.slug} community={item} desktop />)}</div> : <EmptyResults onClear={clearFilters} />
          )}
        </section>
      </div>
    </main>
  )
}

function EmptyResults({ onClear, compact = false }: { onClear: () => void; compact?: boolean }) {
  return <div className={`${compact ? 'absolute inset-x-4 top-1/2 z-30 -translate-y-1/2' : 'mt-10'} rounded-3xl border border-black/10 bg-white/95 p-6 text-center shadow-sm`}><p className="text-lg font-bold">No communities match yet</p><p className="mt-2 text-sm text-black/55">Try a broader activity or clear the filters.</p><button type="button" onClick={onClear} className="mt-4 h-11 rounded-full bg-[#17130E] px-5 text-sm font-bold text-white">Clear filters</button></div>
}

function CommunityMapResult({ community, active, onSelect }: { community: CommunityData; active: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} aria-pressed={active} className={`w-full rounded-2xl border p-3 text-left transition-colors ${active ? 'border-[#E83E6B] bg-[#FDEBF0]' : 'border-black/10 bg-[#F8F4EA] hover:border-black/25'}`}><p className="truncate text-sm font-bold">{community.name}</p><p className="mt-1 text-xs text-black/55">{getCategoryEmoji(community.category)} {categoryName(community.category)} · {community.usualArea || community.cityName}</p><p className="mt-2 line-clamp-1 text-xs font-medium">{community.usualSchedule || 'Schedule varies'} · {priceLabel(community.priceType)}</p></button>
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`h-10 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors ${active ? 'bg-[#E83E6B] text-white' : 'border border-black/10 bg-white text-[#17130E]'}`}>{children}</button>
}

function CommunitySpotlight({ community }: { community: CommunityData }) {
  const image = community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)
  return <article className="overflow-hidden rounded-[1.75rem] border border-black/10 bg-white/95 p-3 shadow-[0_18px_50px_rgba(23,19,14,.22)] backdrop-blur-xl"><div className="flex gap-3"><div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-black/5"><Image src={image} alt={community.name} fill className="object-cover" unoptimized={!image.startsWith('/')} /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><p className="truncate text-base font-bold">{community.name}</p><p className="mt-0.5 text-xs text-black/55">{getCategoryEmoji(community.category)} {categoryName(community.category)} · {community.usualArea || community.cityName}</p></div>{community.isVerified && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E83E6B]" />}</div><div className="mt-2 flex gap-1.5"><span className="rounded-full bg-[#F8F4EA] px-2 py-1 text-[10px] font-semibold">{community.beginnerFriendly ? 'First-timer friendly' : 'Some experience'}</span><span className="rounded-full bg-[#F8F4EA] px-2 py-1 text-[10px] font-semibold">{priceLabel(community.priceType)}</span></div></div></div><Link href={`/communities/${community.slug}`} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-full bg-[#17130E] text-sm font-bold text-white">View community <ArrowRight className="h-4 w-4" /></Link></article>
}

function CommunityRow({ community, desktop = false }: { community: CommunityData; desktop?: boolean }) {
  const image = community.coverImage || community.logoImage || getCategoryFallbackImage(community.category)
  return <Link href={`/communities/${community.slug}`} className={`group block overflow-hidden border border-black/10 bg-white shadow-sm ${desktop ? 'rounded-3xl' : 'rounded-2xl'}`}><div className={`relative ${desktop ? 'aspect-[16/9]' : 'h-32'}`}><Image src={image} alt={community.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized={!image.startsWith('/')} /><div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" /><span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold">{getCategoryEmoji(community.category)} {categoryName(community.category)}</span></div><div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate text-lg font-bold">{community.name}</h2><p className="mt-1 text-xs text-black/55">{community.usualArea || community.cityName || 'Singapore'} · {community.usualSchedule || 'Schedule varies'}</p></div><ArrowRight className="mt-1 h-4 w-4 shrink-0" /></div><div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-[#F8F4EA] px-2.5 py-1 text-[10px] font-semibold">{community.beginnerFriendly ? 'Beginner-friendly' : 'Experienced'}</span><span className="rounded-full bg-[#F8F4EA] px-2.5 py-1 text-[10px] font-semibold">{priceLabel(community.priceType)}</span>{community.nextEvent && <span className="rounded-full bg-[#FDE6E1] px-2.5 py-1 text-[10px] font-semibold text-[#B72E1E]">Next {nextDate(community.nextEvent.startTime)}</span>}</div></div></Link>
}
