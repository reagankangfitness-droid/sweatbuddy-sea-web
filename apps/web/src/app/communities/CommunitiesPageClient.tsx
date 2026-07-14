'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Users, MapPin, Plus, CheckCircle2, ChevronDown, X, ExternalLink, ArrowRight } from 'lucide-react'
import { getCategoryEmoji } from '@/lib/categories'
import { ACTIVITY_CATEGORIES } from '@/lib/categories'

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
  usualArea: string | null
  usualSchedule: string | null
  joinPlatform: string | null
  communityLink: string | null
  sourceUrl: string | null
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
  if (diffDays < 7)
    return d.toLocaleDateString('en-US', { weekday: 'short' })
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
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
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
}: CommunitiesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
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
    [communities]
  )

  const priceOptions = useMemo(
    () =>
      [...new Set(communities.map((c) => c.priceType).filter(Boolean) as string[])]
        .sort((a, b) => formatPriceType(a).localeCompare(formatPriceType(b)))
        .map((value) => ({ value, label: formatPriceType(value) })),
    [communities]
  )

  const platformOptions = useMemo(
    () =>
      [...new Set(communities.map((c) => c.joinPlatform).filter(Boolean) as string[])]
        .sort((a, b) => formatJoinPlatform(a).localeCompare(formatJoinPlatform(b)))
        .map((value) => ({ value, label: formatJoinPlatform(value) })),
    [communities]
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
    [cities]
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
          c.vibeTags.some((tag) => tag.toLowerCase().includes(q))
      )
    }
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter)
    if (cityFilter) result = result.filter((c) => c.citySlug === cityFilter)
    if (areaFilter) result = result.filter((c) => c.usualArea === areaFilter)
    if (priceFilter) result = result.filter((c) => c.priceType === priceFilter)
    if (platformFilter) result = result.filter((c) => c.joinPlatform === platformFilter)
    if (fitFilter === 'beginner') result = result.filter((c) => c.beginnerFriendly)
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

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* ── Compact top bar: search + filters + create ── */}
      <div className="sticky top-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-[#333333]">
        <div className="max-w-6xl mx-auto px-4 py-3 space-y-2.5">
          {/* Row 1: Search + Create */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666666]" />
              <input
                type="text"
                placeholder="Search communities, activities, or cities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <Link
              href="/communities/create"
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white transition-colors hover:bg-neutral-200"
              aria-label="Submit a community"
            >
              <Plus className="w-4 h-4 text-black" />
            </Link>
          </div>

          {/* Row 2: Directory command filters */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <FilterSelect
              label="City"
              value={cityFilter}
              options={cityOptions}
              onChange={setCityFilter}
            />
            <FilterSelect
              label="Activity"
              value={categoryFilter}
              options={availableCategories}
              onChange={setCategoryFilter}
            />
            <FilterSelect
              label="Area"
              value={areaFilter}
              options={areaOptions}
              onChange={setAreaFilter}
            />
            <FilterSelect
              label="Price"
              value={priceFilter}
              options={priceOptions}
              onChange={setPriceFilter}
            />
            <FilterSelect
              label="Fit"
              value={fitFilter}
              options={[
                { value: 'beginner', label: 'Beginner-friendly' },
                { value: 'experienced', label: 'Experienced' },
              ]}
              onChange={setFitFilter}
            />
            <FilterSelect
              label="Join"
              value={platformFilter}
              options={platformOptions}
              onChange={setPlatformFilter}
            />
            <FilterSelect
              label="Vibe"
              value={vibeFilter}
              options={vibeOptions}
              onChange={setVibeFilter}
            />
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex h-10 flex-shrink-0 items-center gap-1 rounded-xl border border-[#333333] bg-[#141414] px-3 text-[11px] font-semibold uppercase tracking-wide text-[#999999] transition-colors hover:border-white/30 hover:text-white"
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
          <p className="text-[11px] text-[#666666] uppercase tracking-widest font-medium">
            {hasFilters
              ? `${filteredCommunities.length} listed communit${filteredCommunities.length === 1 ? 'y' : 'ies'} found`
              : subtitle}
          </p>
          <Link
            href="/communities/nominate"
            className="inline-flex min-h-11 flex-shrink-0 items-center rounded-full px-2 text-[11px] font-semibold uppercase tracking-wide text-[#9fe600] hover:text-white"
          >
            Submit a community
          </Link>
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
            <p className="text-sm text-[#999999] mb-1">
              {hasFilters ? 'No communities match your search.' : 'No communities listed yet.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
              <Link href="/communities/nominate" className="text-xs text-[#9fe600] font-medium hover:underline">
                Suggest a community
              </Link>
              <Link href="/communities/create" className="text-xs text-white font-medium hover:underline">
                Submit a community →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Compact Crew Card ──────────────────────────────────────────
function CrewCard({ community }: { community: CommunityData }) {
  const chips = [
    community.beginnerFriendly ? 'Beginner-friendly' : '',
    community.priceType ? formatPriceType(community.priceType) : '',
    ...community.vibeTags,
  ].filter(Boolean).slice(0, 3)
  const officialLink = community.communityLink || community.sourceUrl
  const verifiedDate = formatVerifiedDate(community.lastVerifiedAt)

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.25 }}
      className="h-full"
    >
      <article className="group flex h-full flex-col rounded-xl bg-[#1A1A1A] p-4 text-center transition-colors duration-200 hover:bg-[#222222]">
        {/* Logo */}
        <Link
          href={`/communities/${community.slug}`}
          className="mx-auto mb-3 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#2A2A2A]"
          aria-label={`View ${community.name}`}
        >
          {community.logoImage ? (
            <Image
              src={community.logoImage}
              alt={community.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : community.creatorImageUrl ? (
            <Image
              src={community.creatorImageUrl}
              alt={community.name}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">{getCategoryEmoji(community.category)}</span>
          )}
        </Link>

        {/* Name + verified */}
        <div className="flex items-center justify-center gap-1 mb-1">
          <Link
            href={`/communities/${community.slug}`}
            className="inline-flex min-h-11 min-w-0 items-center text-sm font-semibold text-white transition-colors hover:text-neutral-300"
          >
            <h3 className="truncate">
              {community.name}
            </h3>
          </Link>
          {community.isVerified && (
            <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
          )}
        </div>

        <p className="text-[11px] text-[#666666] mb-2 capitalize">
          {getCategoryEmoji(community.category)} {community.category.charAt(0).toUpperCase() + community.category.slice(1).replace(/_/g, ' ')}
        </p>

        <div className="space-y-1 text-[11px] text-[#999999]">
          <p className="truncate">{community.usualArea || community.cityName || 'Area TBA'}</p>
          <p className="truncate">{community.usualSchedule || 'Schedule varies'}</p>
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {chips.map((chip) => (
              <span key={chip} className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-semibold text-[#CCCCCC]">
                {chip}
              </span>
            ))}
          </div>
        )}

        {/* Known plan */}
        {community.nextEvent && (
          <p className="text-[10px] text-[#666666] mt-1.5 uppercase tracking-wider">
            Known plan: {formatEventDate(community.nextEvent.startTime)}
          </p>
        )}

        {(community.joinPlatform || community.lastVerifiedAt) && (
          <p className="mt-1 text-[10px] uppercase tracking-wider text-[#555555]">
            {community.joinPlatform ? `Official ${formatJoinPlatform(community.joinPlatform)}` : 'Official link'}
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
          {officialLink ? (
            <a
              href={officialLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg bg-white px-2 text-[11px] font-bold text-black transition-colors hover:bg-neutral-200"
              aria-label={`Join ${community.name} through their official link`}
            >
              Join
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <span className="inline-flex min-h-11 items-center justify-center rounded-lg bg-white/5 px-2 text-[10px] font-semibold text-[#777777]">
              Link pending
            </span>
          )}
          <Link
            href={`/communities/${community.slug}`}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-lg border border-white/12 px-2 text-[11px] font-bold text-white transition-colors hover:border-white/30 hover:bg-white/5"
          >
            Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </article>
    </motion.div>
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
    <label className="relative flex h-10 min-w-[132px] flex-shrink-0 items-center rounded-xl border border-[#333333] bg-[#141414] transition-colors focus-within:border-white/35 hover:border-white/25">
      <span className="pointer-events-none absolute left-3 top-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-[#666666]">
        {label}
      </span>
      <select
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-full w-full appearance-none rounded-xl bg-transparent pb-1.5 pl-3 pr-8 pt-4 text-[12px] font-semibold text-white outline-none"
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
