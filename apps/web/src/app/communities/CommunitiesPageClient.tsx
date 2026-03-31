'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Search,
  Users,
  Calendar,
  MapPin,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react'
import { AvatarStack } from '@/components/avatar-stack'
import { CategoryBadge } from '@/components/category-badge'
import {
  ACTIVITY_CATEGORIES,
  getCategoryBySlug,
  getCategoryColor,
  getCategoryEmoji,
} from '@/lib/categories'

// ─── Types ───────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────
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

// ─── Component ───────────────────────────────────────────────────────
export default function CommunitiesPageClient({
  communities,
  cities,
  subtitle,
}: CommunitiesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)

  // Available categories (only those present in data)
  const availableCategories = useMemo(() => {
    const slugs = new Set(communities.map((c) => c.category))
    return ACTIVITY_CATEGORIES.filter((cat) => slugs.has(cat.slug)).sort(
      (a, b) => a.displayOrder - b.displayOrder
    )
  }, [communities])

  // Filtered communities
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

    if (categoryFilter) {
      result = result.filter((c) => c.category === categoryFilter)
    }

    if (cityFilter) {
      result = result.filter((c) => c.citySlug === cityFilter)
    }

    return result
  }, [communities, searchQuery, categoryFilter, cityFilter])

  const hasFilters = !!(searchQuery.trim() || categoryFilter || cityFilter)

  // Featured: top 2 by member count, only when no filters
  const featuredCommunities = useMemo(() => {
    if (hasFilters) return []
    return [...communities]
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 2)
  }, [communities, hasFilters])

  const featuredIds = new Set(featuredCommunities.map((c) => c.id))

  // Grid: filtered minus featured
  const gridCommunities = useMemo(() => {
    return filteredCommunities.filter((c) => !featuredIds.has(c.id))
  }, [filteredCommunities, featuredIds])

  return (
    <div className="min-h-screen bg-[#FFFBF8]">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#FFFBF8]">
        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
              Find People Worth{' '}
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                Sweating With
              </span>
            </h1>
            <p className="text-[#4A4A5A] text-base md:text-lg max-w-xl mx-auto mb-8">
              {subtitle}
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
              <input
                type="text"
                placeholder="Search your people…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-black/[0.06] rounded-xl text-sm text-[#1A1A1A] placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-black/[0.12] transition-all shadow-sm"
              />
            </div>

            <p className="text-xs text-[#9A9AAA] mt-4">
              Don&apos;t see your crew?{' '}
              <Link href="/communities/create" className="text-[#1A1A1A] font-semibold hover:underline">
                Start one →
              </Link>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Filter Bar ───────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2.5">
          {/* Row 1: City filter */}
          {cities.length > 0 && (
            <div className="relative">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <span className="flex-shrink-0 text-xs font-semibold text-[#71717A] uppercase tracking-wide mr-1">City</span>
                <button
                  onClick={() => setCityFilter(null)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    !cityFilter
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#71717A] border-black/[0.06] hover:border-black/[0.12]'
                  }`}
                >
                  All cities
                </button>
                {cities.map((city) => (
                  <button
                    key={city.slug}
                    onClick={() => setCityFilter(cityFilter === city.slug ? null : city.slug)}
                    className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      cityFilter === city.slug
                        ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                        : 'bg-white text-[#71717A] border-black/[0.06] hover:border-black/[0.12]'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    {city.name}
                    <span className="text-[10px] opacity-60">{city.communityCount}</span>
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
            </div>
          )}

          {/* Row 2: Category filter */}
          <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="flex-shrink-0 text-xs font-semibold text-[#71717A] uppercase tracking-wide mr-1">Type</span>
              <button
                onClick={() => setCategoryFilter(null)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  !categoryFilter
                    ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                    : 'bg-white text-[#71717A] border-black/[0.06] hover:border-black/[0.12]'
                }`}
              >
                All types
              </button>
              {availableCategories.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setCategoryFilter(categoryFilter === cat.slug ? null : cat.slug)}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    categoryFilter === cat.slug
                      ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                      : 'bg-white text-[#71717A] border-black/[0.06] hover:border-black/[0.12]'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Featured ─────────────────────────────────────────── */}
      {featuredCommunities.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-10 pb-2">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-[#4A4A5A] uppercase tracking-wide">
                Featured
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {featuredCommunities.map((community, i) => (
                <Link
                  key={community.id}
                  href={`/communities/${community.slug}`}
                  className="group relative rounded-2xl overflow-hidden aspect-[16/9] block"
                >
                  {/* Image / gradient background */}
                  <div className="absolute inset-0">
                    {community.coverImage ? (
                      <Image
                        src={community.coverImage}
                        alt={community.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${getCategoryColor(community.category)}40, ${getCategoryColor(community.category)}15)`,
                          backgroundColor: '#f5f0eb',
                        }}
                      >
                        <span className="text-6xl md:text-7xl opacity-20 select-none">
                          {getCategoryEmoji(community.category)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  </div>

                  {/* Category badge */}
                  <div className="absolute top-4 left-4 z-10">
                    <CategoryBadge
                      slug={community.category}
                      variant="filled"
                      size="small"
                    />
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <h3 className="text-lg font-bold text-white mb-1.5">
                      {community.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-white/80">
                      {community.cityName && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {community.cityName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {community.memberCount} members
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <AvatarStack
                        participants={community.members}
                        maxDisplay={4}
                        size="sm"
                      />
                      {community.nextEvent && (
                        <span className="text-xs text-white/60">
                          Next: {formatEventDate(community.nextEvent.startTime)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ── Grid ─────────────────────────────────────────────── */}
      <section className="pb-24 md:pb-20">
        <div className="max-w-6xl mx-auto px-4 pt-8">
          {gridCommunities.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.06 } },
              }}
            >
              {gridCommunities.map((community) => (
                <CommunityCard key={community.id} community={community} />
              ))}
            </motion.div>
          ) : (
            /* ── Empty state ─── */
            <div className="text-center py-20">
              <div className="w-14 h-14 rounded-2xl bg-white border border-black/[0.06] flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Users className="w-6 h-6 text-[#71717A]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-2">
                {hasFilters
                  ? 'Nothing here yet. Try a different search.'
                  : 'No crews here yet. Be the first.'}
              </h3>
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-black/[0.06]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="relative max-w-2xl mx-auto px-4 py-16 md:py-24 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mb-4">
            Ready to start{' '}
            <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              something
            </span>
            ?
          </h2>
          <p className="text-[#4A4A5A] text-base md:text-lg mb-8 max-w-md mx-auto">
            The best communities started with one person who said &apos;who&apos;s in?&apos;
          </p>
          <Link
            href="/communities/create"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-semibold hover:bg-black transition-colors"
          >
            Start a crew
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  )
}

// ─── Card Component ──────────────────────────────────────────────────
function CommunityCard({ community }: { community: CommunityData }) {
  const categoryColor = getCategoryColor(community.category)
  const eventCount = Math.max(
    community._count.activities,
    community.eventCount
  )

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.35 }}
    >
      <Link
        href={`/communities/${community.slug}`}
        className="group block bg-white border border-black/[0.06] rounded-2xl overflow-hidden shadow-sm hover:border-black/[0.12] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Cover */}
        <div className="relative h-40 overflow-hidden">
          {community.coverImage ? (
            <Image
              src={community.coverImage}
              alt={community.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}40, ${categoryColor}15)`,
                backgroundColor: '#f5f0eb',
              }}
            >
              <span className="text-5xl opacity-20 select-none">
                {getCategoryEmoji(community.category)}
              </span>
            </div>
          )}

          {/* Category badge */}
          <div className="absolute top-3 left-3 z-10">
            <CategoryBadge
              slug={community.category}
              size="small"
              className="backdrop-blur-sm"
            />
          </div>

          {/* Verified badge */}
          {community.isVerified && (
            <div className="absolute top-3 right-3 z-10">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 backdrop-blur-sm">
                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-medium text-blue-600">
                  Verified
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start gap-3">
            {/* Avatar overlapping cover */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 -mt-9 bg-white shadow-lg"
              style={{
                border: `2.5px solid ${categoryColor}`,
                boxShadow: `0 0 12px ${categoryColor}22`,
              }}
            >
              {community.logoImage ? (
                <Image
                  src={community.logoImage}
                  alt={community.name}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : community.creatorImageUrl ? (
                <Image
                  src={community.creatorImageUrl}
                  alt={community.creatorName || ''}
                  width={48}
                  height={48}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Users className="w-5 h-5 text-[#71717A]" />
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-semibold text-[#1A1A1A] truncate group-hover:text-blue-500 transition-colors">
                {community.name}
              </h3>
              {community.cityName && (
                <p className="text-sm text-[#71717A] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {community.cityName}
                </p>
              )}
            </div>
          </div>

          {community.description && (
            <p className="mt-3 text-sm text-[#4A4A5A] line-clamp-2">
              {community.description}
            </p>
          )}

          {/* Social proof row */}
          <div className="mt-4 flex items-center gap-3">
            {community.members.length > 0 && (
              <AvatarStack
                participants={community.members}
                maxDisplay={3}
                size="xs"
              />
            )}
            <div className="flex items-center gap-3 text-xs text-[#71717A]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {community.memberCount}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {eventCount} events
              </span>
            </div>
          </div>

          {/* Next event teaser */}
          {community.nextEvent && (
            <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-[#FFFBF8] rounded-lg border border-black/[0.06]">
              <Calendar className="w-3.5 h-3.5 text-[#71717A] flex-shrink-0" />
              <span className="text-xs text-[#4A4A5A] truncate">
                {community.nextEvent.title}
              </span>
              <span className="text-xs text-[#71717A] flex-shrink-0 ml-auto">
                {formatEventDate(community.nextEvent.startTime)}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
