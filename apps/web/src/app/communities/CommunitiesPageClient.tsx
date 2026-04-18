'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Users, MapPin, Plus, CheckCircle2 } from 'lucide-react'
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

// ─── Component ───────────────────────────────────────────────────
export default function CommunitiesPageClient({
  communities,
  cities,
}: CommunitiesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)

  const availableCategories = useMemo(() => {
    const slugs = new Set(communities.map((c) => c.category))
    return ACTIVITY_CATEGORIES.filter((cat) => slugs.has(cat.slug)).sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
  }, [communities])

  const filteredCommunities = useMemo(() => {
    let result = communities
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.cityName?.toLowerCase().includes(q)
      )
    }
    if (categoryFilter) result = result.filter((c) => c.category === categoryFilter)
    if (cityFilter) result = result.filter((c) => c.citySlug === cityFilter)
    return result
  }, [communities, searchQuery, categoryFilter, cityFilter])

  const hasFilters = !!(searchQuery.trim() || categoryFilter || cityFilter)

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
                placeholder="Search crews..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#1A1A1A] border border-[#333333] rounded-xl text-sm text-white placeholder:text-[#666666] focus:outline-none focus:border-white/20 transition-all"
              />
            </div>
            <Link
              href="/communities/create"
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-neutral-200 transition-colors"
            >
              <Plus className="w-4 h-4 text-black" />
            </Link>
          </div>

          {/* Row 2: City + Category pills */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {cities.length > 0 && cities.map((city) => (
              <button
                key={city.slug}
                onClick={() => setCityFilter(cityFilter === city.slug ? null : city.slug)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  cityFilter === city.slug
                    ? 'bg-white text-black'
                    : 'bg-[#1A1A1A] text-[#999999] hover:text-white'
                }`}
              >
                {city.name}
              </button>
            ))}
            <div className="w-px bg-[#333333] flex-shrink-0 mx-1" />
            {availableCategories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all flex items-center gap-1 ${
                  categoryFilter === cat.slug
                    ? 'bg-white text-black'
                    : 'bg-[#1A1A1A] text-[#999999] hover:text-white'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Crew count ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <p className="text-[11px] text-[#666666] uppercase tracking-widest font-medium">
          {filteredCommunities.length} crew{filteredCommunities.length !== 1 ? 's' : ''}
          {hasFilters ? ' found' : ''}
        </p>
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-4 pb-24">
        {filteredCommunities.length > 0 ? (
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
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
              {hasFilters ? 'No crews match your search.' : 'No crews yet.'}
            </p>
            <Link href="/communities/create" className="text-xs text-white font-medium hover:underline">
              Start one →
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Compact Crew Card ──────────────────────────────────────────
function CrewCard({ community }: { community: CommunityData }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.25 }}
    >
      <Link
        href={`/communities/${community.slug}`}
        className="group block bg-[#1A1A1A] rounded-xl p-4 hover:bg-[#222222] transition-all duration-200 text-center"
      >
        {/* Logo */}
        <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden bg-[#2A2A2A] flex items-center justify-center">
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
        </div>

        {/* Name + verified */}
        <div className="flex items-center justify-center gap-1 mb-1">
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-neutral-300 transition-colors">
            {community.name}
          </h3>
          {community.isVerified && (
            <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
          )}
        </div>

        {/* Category */}
        <p className="text-[11px] text-[#666666] mb-2">
          {getCategoryEmoji(community.category)} {community.category.charAt(0).toUpperCase() + community.category.slice(1).replace(/_/g, ' ')}
        </p>

        {/* Member count */}
        <p className="text-[12px] text-[#999999] flex items-center justify-center gap-1">
          <Users className="w-3 h-3" />
          {community.memberCount} showing up
        </p>

        {/* Next session */}
        {community.nextEvent && (
          <p className="text-[10px] text-[#666666] mt-1.5 uppercase tracking-wider">
            Next: {formatEventDate(community.nextEvent.startTime)}
          </p>
        )}

        {/* City */}
        {community.cityName && (
          <p className="text-[10px] text-[#555555] mt-1 flex items-center justify-center gap-0.5">
            <MapPin className="w-2.5 h-2.5" />
            {community.cityName}
          </p>
        )}
      </Link>
    </motion.div>
  )
}
