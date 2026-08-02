'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Search,
  Users,
  MapPin,
  Plus,
  CheckCircle2,
  ChevronDown,
  X,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { CityGuideTabs } from '@/components/city-guide/CityGuideTabs'
import { getCategoryEmoji } from '@/lib/categories'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'
import { COMMUNITY_SEO_GUIDES } from '@/lib/community-seo-guides'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'
import {
  CommunityWeeklyPicksForm,
  SaveCommunityButton,
  trackCommunityDirectoryEvent,
} from '@/components/community/CommunityDirectoryActions'

const CREW_PROOF_IMAGES = [
  { src: '/images/hosts/run-club-group.jpg', label: 'Run groups' },
  { src: '/images/community-bonds.jpg', label: 'Social proof' },
  { src: '/images/organizers-bg.jpg', label: 'Hosts' },
]

const QUICK_FILTERS = [
  { label: 'Run clubs', category: 'running' },
  { label: 'Yoga', category: 'yoga' },
  { label: 'Pickleball', category: 'pickleball' },
  { label: 'Beginner', fit: 'beginner' },
  { label: 'Solo-friendly', fit: 'solo' },
  { label: 'Free', price: 'free' },
]

// ─── Types ───────────────────────────────────────────────────────
export interface CommunityMemberData {
  id: string
  name: string | null
  imageUrl: string | null
}

export interface NextEventData {
  id: string
  title: string
  startTime: string
  categorySlug: string | null
}

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

export interface CityData {
  name: string
  slug: string
  communityCount: number
}

interface CommunitiesPageClientProps {
  communities: CommunityData[]
  cities: CityData[]
  subtitle: string
  initialCitySlug?: string | null
}

interface FilterOption {
  value: string
  label: string
}

// ─── Helpers ─────────────────────────────────────────────────────
function formatEventDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatVerifiedDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

function humanizeSlug(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

function categoryLabel(slug: string): string {
  const category = ACTIVITY_CATEGORIES.find((cat) => cat.slug === slug)
  return category ? category.name : humanizeSlug(slug)
}

function uniqueOptions(values: Array<string | null | undefined>): FilterOption[] {
  return [...new Set(values.filter(Boolean) as string[])]
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: humanizeSlug(value) }))
}

// ─── Component ───────────────────────────────────────────────────
export default function CommunitiesPageClient({
  communities,
  cities,
  subtitle,
  initialCitySlug = null,
}: CommunitiesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(initialCitySlug)
  const [areaFilter, setAreaFilter] = useState<string | null>(null)
  const [priceFilter, setPriceFilter] = useState<string | null>(null)
  const [platformFilter, setPlatformFilter] = useState<string | null>(null)
  const [fitFilter, setFitFilter] = useState<string | null>(null)
  const [vibeFilter, setVibeFilter] = useState<string | null>(null)

  const availableCategories = useMemo(() => {
    const knownOrder = new Map(ACTIVITY_CATEGORIES.map((cat) => [cat.slug, cat.displayOrder]))
    return [...new Set(communities.map((c) => c.category))]
      .sort((a, b) => (knownOrder.get(a) ?? 999) - (knownOrder.get(b) ?? 999) || a.localeCompare(b))
      .map((slug) => ({ value: slug, label: categoryLabel(slug) }))
  }, [communities])

  const areaOptions = useMemo(
    () => uniqueOptions(communities.map((c) => c.usualArea)),
    [communities],
  )

  const priceOptions = useMemo(
    () =>
      [...new Set(communities.map((c) => c.priceType).filter(Boolean) as string[])]
        .sort((a, b) => formatPriceType(a).localeCompare(formatPriceType(b)))
        .map((value) => ({ value, label: formatPriceType(value) })),
    [communities],
  )

  const platformOptions = useMemo(
    () =>
      [...new Set(communities.map((c) => c.joinPlatform).filter(Boolean) as string[])]
        .sort((a, b) => formatJoinPlatform(a).localeCompare(formatJoinPlatform(b)))
        .map((value) => ({ value, label: formatJoinPlatform(value) })),
    [communities],
  )

  const vibeOptions = useMemo(() => {
    const counts = new Map<string, number>()
    for (const community of communities) {
      for (const tag of community.vibeTags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1)
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 18)
      .map(([value]) => ({ value, label: humanizeSlug(value) }))
  }, [communities])

  const cityOptions = useMemo(
    () => cities.map((city) => ({ value: city.slug, label: city.name })),
    [cities],
  )

  const filteredCommunities = useMemo(() => {
    let result = communities
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.cityName?.toLowerCase().includes(q) ||
          c.usualArea?.toLowerCase().includes(q) ||
          c.bestFor?.toLowerCase().includes(q) ||
          c.sourceLabel?.toLowerCase().includes(q) ||
          c.vibeTags.some((tag) => tag.toLowerCase().includes(q)),
      )
    }
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter)
    if (cityFilter) result = result.filter((c) => c.citySlug === cityFilter)
    if (areaFilter) result = result.filter((c) => c.usualArea === areaFilter)
    if (priceFilter) result = result.filter((c) => c.priceType === priceFilter)
    if (platformFilter) result = result.filter((c) => c.joinPlatform === platformFilter)
    if (fitFilter === 'beginner') result = result.filter((c) => c.beginnerFriendly)
    if (fitFilter === 'solo') result = result.filter((c) => c.soloFriendly)
    if (fitFilter === 'experienced') result = result.filter((c) => !c.beginnerFriendly)
    if (vibeFilter) result = result.filter((c) => c.vibeTags.includes(vibeFilter))
    return result
  }, [
    communities,
    searchQuery,
    categoryFilter,
    cityFilter,
    areaFilter,
    priceFilter,
    platformFilter,
    fitFilter,
    vibeFilter,
  ])

  const hasFilters = !!(
    searchQuery.trim() ||
    categoryFilter ||
    cityFilter ||
    areaFilter ||
    priceFilter ||
    platformFilter ||
    fitFilter ||
    vibeFilter
  )
  const hasSources = communities.length > 0
  const plansHref = cityFilter
    ? `/buddy?view=list&city=${encodeURIComponent(cityFilter)}`
    : '/buddy?view=list&location=nearby'
  const showCityFilter = cityOptions.length > 1

  const clearFilters = () => {
    setSearchQuery('')
    setCategoryFilter(null)
    setCityFilter(null)
    setAreaFilter(null)
    setPriceFilter(null)
    setPlatformFilter(null)
    setFitFilter(null)
    setVibeFilter(null)
  }

  const applyQuickFilter = (filter: typeof QUICK_FILTERS[number]) => {
    if (filter.category) {
      const nextValue = categoryFilter === filter.category ? null : filter.category
      setCategoryFilter(nextValue)
      trackFilter('quick_activity', nextValue)
      return
    }

    if (filter.fit) {
      const nextValue = fitFilter === filter.fit ? null : filter.fit
      setFitFilter(nextValue)
      trackFilter('quick_fit', nextValue)
      return
    }

    if (filter.price) {
      const nextValue = priceFilter === filter.price ? null : filter.price
      setPriceFilter(nextValue)
      trackFilter('quick_price', nextValue)
    }
  }

  const isQuickFilterActive = (filter: typeof QUICK_FILTERS[number]) => (
    (filter.category && categoryFilter === filter.category) ||
    (filter.fit && fitFilter === filter.fit) ||
    (filter.price && priceFilter === filter.price)
  )

  const trackFilter = (filter: string, value: string | null) => {
    trackCommunityDirectoryEvent('community_directory_filter_used', {
      filter,
      value,
      resultCount: filteredCommunities.length,
    })
  }

  const trackSearch = () => {
    const query = searchQuery.trim()
    if (!query) return
    trackCommunityDirectoryEvent('community_directory_search_used', {
      query,
      resultCount: filteredCommunities.length,
    })
  }

  return (
    <div className="sb-page" data-sb-paper-shell>
      <header className="border-b border-white/[0.07] bg-[#0B0D0C]">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:py-4">
          <div className="flex min-h-10 items-center justify-between gap-2">
            <Link
              href="/"
              aria-label="SweatBuddies home"
              className="inline-flex min-h-10 min-w-10 items-center"
            >
              <LogoWithText
                size={24}
                color="#FFFFFF"
                textColor="#FFFFFF"
                wordmarkClassName="max-[360px]:hidden"
              />
            </Link>
            <Link
              href={plansHref}
              aria-label="Explore plans"
              className="sb-button-secondary min-h-9 shrink-0 px-3 text-[10px]"
            >
              <span aria-hidden="true" className="min-[380px]:hidden">Plans</span>
              <span aria-hidden="true" className="hidden min-[380px]:inline">Explore plans</span>
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:mt-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
            <div>
              <p className="sb-eyebrow">
                Community directory
              </p>
              <h1 className="mt-2 max-w-3xl text-[1.65rem] font-semibold leading-[1.08] tracking-tight sm:mt-3 sm:text-4xl">
                {hasSources
                  ? 'Find active fitness communities you can confidently join.'
                  : 'Help map verified fitness communities.'}
              </h1>
              <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-white/68 sm:mt-4 sm:line-clamp-none sm:text-base">
                {hasSources
                  ? 'Start with official links, usual areas, schedule signals, and solo-friendly cues so you know where to join before you show up.'
                  : 'Submit official pages or group links. We review each community before it appears publicly.'}
              </p>
            </div>
            {hasSources ? (
              <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                <div className="sb-surface p-3">
                  <p className="font-mono text-lg font-black text-white">{communities.length}</p>
                  <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-wide text-white/62">
                    Communities
                  </p>
                </div>
                <div className="sb-surface p-3">
                  <p className="font-mono text-lg font-black text-white">
                    {communities.filter((community) => community.beginnerFriendly).length}
                  </p>
                  <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-wide text-white/62">
                    Beginner
                  </p>
                </div>
                <div className="sb-surface p-3">
                  <p className="font-mono text-lg font-black text-[#C6E76A]">
                    {communities.filter((community) => community.soloFriendly).length}
                  </p>
                  <p className="mt-1 font-mono text-[10px] font-black uppercase tracking-wide text-white/62">
                    Solo-friendly
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/42">
                  Clean slate
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  No public communities yet.
                </p>
                <p className="mt-1 text-sm leading-6 text-white/58">
                  The first listings will come from verified official sources.
                </p>
              </div>
            )}
          </div>
        </div>
      </header>
      <CityGuideTabs active="communities" citySlug={cityFilter ?? undefined} />
      {hasSources ? <CrewProofStrip /> : null}

      {hasSources ? (
        <>
          {/* ── Compact top bar: search + filters + create ── */}
          <div className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D0C]/95 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
              {/* Row 1: Search + Create */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
                  <input
                    type="text"
                    placeholder="Search communities, activities, or areas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={trackSearch}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') trackSearch()
                    }}
                    className="min-h-11 w-full rounded-lg border border-white/15 bg-[#111412] py-2.5 pl-9 pr-4 text-sm text-white transition-all placeholder:text-white/50 focus:border-[#C6E76A] focus:outline-none max-[360px]:placeholder:text-[12px]"
                  />
                </div>
                <Link
                  href="/communities/nominate"
                  className="sb-button-primary h-11 w-11 flex-shrink-0 p-0"
                  aria-label="Suggest a community"
                >
                  <Plus className="w-4 h-4 text-black" />
                </Link>
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-0.5 sm:hidden">
                {QUICK_FILTERS.map((filter) => (
                  <QuickFilterButton
                    key={filter.label}
                    label={filter.label}
                    active={Boolean(isQuickFilterActive(filter))}
                    onClick={() => applyQuickFilter(filter)}
                  />
                ))}
              </div>

              {/* Row 2: Directory command filters */}
              <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                {showCityFilter && (
                  <FilterSelect
                    label="City"
                    value={cityFilter}
                    options={cityOptions}
                    onChange={(value) => {
                      setCityFilter(value)
                      trackFilter('city', value)
                    }}
                  />
                )}
                <FilterSelect
                  label="Activity"
                  value={categoryFilter}
                  options={availableCategories}
                  onChange={(value) => {
                    setCategoryFilter(value)
                    trackFilter('activity', value)
                  }}
                />
                <FilterSelect
                  label="Area"
                  value={areaFilter}
                  options={areaOptions}
                  onChange={(value) => {
                    setAreaFilter(value)
                    trackFilter('area', value)
                  }}
                />
                <FilterSelect
                  label="Price"
                  value={priceFilter}
                  options={priceOptions}
                  onChange={(value) => {
                    setPriceFilter(value)
                    trackFilter('price', value)
                  }}
                />
                <FilterSelect
                  label="Fit"
                  value={fitFilter}
                  options={[
                    { value: 'beginner', label: 'Beginner-friendly' },
                    { value: 'solo', label: 'Solo-friendly' },
                    { value: 'experienced', label: 'Experienced' },
                  ]}
                  onChange={(value) => {
                    setFitFilter(value)
                    trackFilter('fit', value)
                  }}
                />
                <div className="hidden sm:block">
                  <FilterSelect
                    label="Join"
                    value={platformFilter}
                    options={platformOptions}
                    onChange={(value) => {
                      setPlatformFilter(value)
                      trackFilter('join', value)
                    }}
                  />
                </div>
                <div className="hidden sm:block">
                  <FilterSelect
                    label="Vibe"
                    value={vibeFilter}
                    options={vibeOptions}
                    onChange={(value) => {
                      setVibeFilter(value)
                      trackFilter('vibe', value)
                    }}
                  />
                </div>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="sb-button-secondary min-h-11 flex-shrink-0 rounded-lg px-3 text-[11px]"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* ── Directory count ── */}
          <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] font-black uppercase tracking-[0.18em] text-white/62">
                {hasFilters
                  ? `${filteredCommunities.length} communit${filteredCommunities.length === 1 ? 'y' : 'ies'} found`
                  : `${subtitle} · official join paths checked`}
              </p>
              <Link
                href="/communities/nominate"
                className="inline-flex min-h-11 flex-shrink-0 items-center rounded-full px-2 text-[11px] font-black uppercase tracking-wide text-[#C6E76A] hover:text-white"
              >
                Suggest a community
              </Link>
            </div>
            <div className="mt-4">
              <CommunityWeeklyPicksForm source="directory" city={cityFilter ? cityOptions.find((city) => city.value === cityFilter)?.label : 'your city'} />
            </div>
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
              {COMMUNITY_SEO_GUIDES.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/communities/singapore/${guide.slug}`}
                  className="inline-flex min-h-10 flex-shrink-0 items-center rounded-full border border-white/12 px-3 text-[10px] font-black uppercase tracking-wide text-white/52 transition-colors hover:border-[#C6E76A] hover:text-[#C6E76A]"
                >
                  {guide.filterLabel}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Grid ── */}
          <div className="max-w-6xl mx-auto px-4 pb-24">
            {filteredCommunities.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
                initial="hidden"
                animate="visible"
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {filteredCommunities.map((community) => (
                  <CrewCard key={community.id} community={community} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <Users className="w-8 h-8 text-[#666666] mx-auto mb-3" />
                <p className="text-sm text-[#999999] mb-1">No communities match your search.</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-medium text-white hover:underline"
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/communities/nominate"
                    className="inline-flex min-h-11 items-center rounded-full px-2 text-xs font-medium text-[#9fe600] hover:underline"
                  >
                    Suggest a community
                  </Link>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mx-auto grid max-w-4xl gap-3 px-4 py-8 pb-28 md:grid-cols-2">
          <Link
            href="/communities/nominate"
            className="rounded-lg border-2 border-[#17130E] bg-[#E8412C] p-4 text-white shadow-[3px_3px_0_#17130E] transition-colors hover:bg-[#F0523E]"
          >
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/82">
              Help map a community
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Suggest a community</h2>
            <p className="mt-2 text-sm leading-6 text-white/78">
              Send the official page or group link. We will review it before it appears publicly.
            </p>
          </Link>
          <Link
            href={plansHref}
            className="rounded-lg border border-white/12 bg-white/[0.04] p-4 transition-colors hover:border-white/28"
          >
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-white/44">
              Ready now
            </p>
            <h2 className="mt-2 text-xl font-semibold text-white">Explore plans</h2>
            <p className="mt-2 text-sm leading-6 text-white/62">
              Plans remain visible while the first community pages are being reviewed.
            </p>
          </Link>
        </div>
      )}
    </div>
  )
}

function CrewProofStrip() {
  return (
    <section className="hidden border-b border-white/10 bg-[#0B0D0C] px-4 py-3 sm:block">
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2">
        {CREW_PROOF_IMAGES.map((item) => (
          <div
            key={item.src}
            className="relative h-20 overflow-hidden rounded-xl border border-white/[0.08] bg-[#1A1E1B] sm:h-28"
          >
            <Image
              src={item.src}
              alt={`${item.label} on SweatBuddies`}
              fill
              sizes="(min-width: 640px) 33vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/12 to-transparent" />
            <span className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-white/86 backdrop-blur">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Compact Crew Card ──────────────────────────────────────────
function CrewCard({ community }: { community: CommunityData }) {
  const chips = [
    community.beginnerFriendly ? 'Beginner-friendly' : '',
    community.soloFriendly ? 'Solo-friendly' : '',
    community.priceType ? formatPriceType(community.priceType) : '',
    ...community.vibeTags,
  ]
    .filter(Boolean)
    .slice(0, 3)
  const hasOfficialLink = Boolean(community.communityLink || community.websiteUrl || community.sourceUrl)
  const verifiedDate = formatVerifiedDate(community.lastVerifiedAt)
  const cardImage = community.coverImage || community.logoImage || community.creatorImageUrl || getCategoryFallbackImage(community.category)
  const activitySignal = community.eventCount > 0
    ? `${community.eventCount} known plan${community.eventCount === 1 ? '' : 's'}`
    : hasOfficialLink
      ? 'Official join path'
      : 'Source pending'
  const confidenceLabel = community.confidenceScore
    ? `Confidence ${community.confidenceScore}`
    : community.confidenceTier
      ? `${community.confidenceTier} confidence`
      : null

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <article className="group flex h-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#151816] text-center transition-colors duration-200 hover:border-[#C6E76A]/35 hover:bg-[#1B1B1B]">
        <Link
          href={`/communities/${community.slug}`}
          className="relative block aspect-[16/10] overflow-hidden bg-[#222222]"
          aria-label={`View ${community.name}`}
        >
          <Image
            src={cardImage}
            alt={community.name}
            fill
            sizes="(min-width: 1024px) 260px, (min-width: 640px) 33vw, 100vw"
            className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
            unoptimized={!cardImage.startsWith('/')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/12 to-black/10" />
          <span className="absolute left-3 top-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-white backdrop-blur">
            {getCategoryEmoji(community.category)} {categoryLabel(community.category)}
          </span>
          <span className="absolute bottom-3 left-3 rounded-md bg-black/55 px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wide text-[#C6E76A] backdrop-blur">
            {community.nextEvent
              ? `Next ${formatEventDate(community.nextEvent.startTime)}`
              : 'Source page'}
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-4">
          {/* Name + verified */}
          <div className="flex items-center justify-center gap-1 mb-1">
            <Link
              href={`/communities/${community.slug}`}
              className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-white transition-colors hover:text-neutral-300"
            >
              <h3 className="truncate">{community.name}</h3>
            </Link>
            {community.isVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C6E76A] flex-shrink-0" />
            )}
          </div>

          <p className="text-[11px] text-[#666666] mb-2 capitalize">
            {getCategoryEmoji(community.category)}{' '}
            {community.category.charAt(0).toUpperCase() +
              community.category.slice(1).replace(/_/g, ' ')}
          </p>

          <div className="space-y-1 text-[11px] text-[#999999]">
            <p className="truncate">{community.usualArea || community.cityName || 'Area TBA'}</p>
            <p className="truncate">{community.usualSchedule || 'Schedule varies'}</p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border border-[#C6E76A]/18 bg-[#C6E76A]/8 px-2 py-1.5 text-left">
              <p className="truncate font-mono text-[9px] font-black uppercase tracking-wide text-[#C6E76A]">
                Activity
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-white/82">{activitySignal}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5 text-left">
              <p className="truncate font-mono text-[9px] font-black uppercase tracking-wide text-[#777777]">
                Join path
              </p>
              <p className="mt-0.5 truncate text-[11px] font-bold text-white/82">
                {confidenceLabel || (hasOfficialLink ? 'Link found' : 'Needs review')}
              </p>
            </div>
          </div>

          {community.bestFor && (
            <p className="mt-2 line-clamp-2 min-h-[32px] text-xs leading-4 text-white/66">
              {community.bestFor}
            </p>
          )}

          {chips.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[9px] font-semibold text-[#CCCCCC]"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}

          {/* Known plan */}
          <div className="mt-2 rounded-lg border border-white/10 bg-[#101010] px-3 py-2 text-left">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#C6E76A]">
              {community.nextEvent ? 'Next known plan' : 'Source check'}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-white/82">
              {community.nextEvent
                ? `${community.nextEvent.title} · ${formatEventDate(community.nextEvent.startTime)}`
                : hasOfficialLink
                  ? 'Official join path found'
                  : 'Join path pending'}
            </p>
          </div>

          {(community.joinPlatform || community.lastVerifiedAt) && (
            <p className="mt-1 text-[10px] uppercase tracking-wider text-[#555555]">
              {community.sourceLabel || (community.joinPlatform
                ? `Official ${formatJoinPlatform(community.joinPlatform)}`
                : 'Official link')}
              {verifiedDate ? ` · checked ${verifiedDate}` : ''}
            </p>
          )}

          {/* City */}
          {community.cityName && (
            <p className="text-[10px] text-[#555555] mt-1 flex items-center justify-center gap-0.5">
              <MapPin className="w-2.5 h-2.5" />
              {community.cityName}
            </p>
          )}

          <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
            <SaveCommunityButton
              communitySlug={community.slug}
              communityName={community.name}
              source="card"
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full border border-white/12 px-2 text-[11px] font-bold text-white transition-colors hover:border-[#C6E76A]/60 hover:bg-white/5"
            />
            <Link
              href={`/communities/${community.slug}`}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-[#C6E76A] px-2 text-[11px] font-bold text-black transition-colors hover:bg-[#D8F18A]"
              aria-label={`View ${community.name} details`}
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </article>
    </motion.div>
  )
}

function QuickFilterButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-10 shrink-0 rounded-full border px-3 text-[11px] font-black uppercase tracking-wide transition-colors ${
        active
          ? 'border-[#C6E76A] bg-[#C6E76A] text-black'
          : 'border-white/12 bg-[#151816] text-white/66 hover:border-[#C6E76A]/60 hover:text-white'
      }`}
    >
      {label}
    </button>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string | null
  options: FilterOption[]
  onChange: (value: string | null) => void
}) {
  return (
    <label className="relative flex min-h-11 min-w-[132px] flex-shrink-0 items-center rounded-lg border border-white/15 bg-[#151816] transition-colors focus-within:border-[#C6E76A] hover:border-white/25">
      <span className="pointer-events-none absolute left-3 top-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="min-h-11 w-full appearance-none rounded-lg bg-transparent pb-1.5 pl-3 pr-8 pt-4 text-[12px] font-semibold text-white outline-none"
        aria-label={label}
      >
        <option value="">{label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#777777]" />
    </label>
  )
}

function formatJoinPlatform(value: string): string {
  return humanizeSlug(value.toLowerCase())
}

function formatPriceType(value: string): string {
  const normalized = value.toLowerCase()
  if (normalized === 'free') return 'Free'
  if (normalized === 'paid') return 'Paid'
  if (normalized === 'mixed' || normalized === 'free_paid') return 'Free + paid'
  if (normalized === 'membership') return 'Membership'
  if (normalized === 'charity') return 'Charity'
  if (normalized === 'pay_what_you_can') return 'Pay what you can'
  return humanizeSlug(normalized)
}
