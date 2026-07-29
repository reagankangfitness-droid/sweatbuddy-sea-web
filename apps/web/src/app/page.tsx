import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, CalendarDays, MapPin, Search, Users } from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { CityGuideTabs } from '@/components/city-guide/CityGuideTabs'
import { EVENTS } from '@/lib/analytics'
import { getPublicCommunitySeeds } from '@/lib/community-directory-seed'
import { resolveSessionMediaMap, type ResolvedSessionMedia } from '@/lib/session-media'
import { getCategoryFallbackImage } from '@/lib/visual-fallbacks'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SweatBuddies - Fitness Communities You Can Actually Join',
  description:
    'Find active fitness communities near you by area, vibe, schedule, and beginner-friendliness.',
}

const activityFilters = [
  { label: 'Run clubs', href: '/communities' },
  { label: 'Yoga / Pilates', href: '/communities' },
  { label: 'Pickleball', href: '/communities' },
  { label: 'Strength', href: '/communities' },
  { label: 'Recovery', href: '/communities' },
  { label: 'Communities', href: '/communities' },
]

const decisionFilters = [
  { label: 'Run clubs', href: '/communities' },
  { label: 'Beginner-friendly', href: '/communities' },
  { label: 'Solo-friendly', href: '/communities' },
  { label: 'Free', href: '/communities' },
]

const fallbackPlanCards = [
  {
    title: 'Morning run clubs',
    href: '/communities',
    image: '/banner/running.jpg',
    meta: 'Easy pace · first-timer friendly',
    signal: 'Community',
  },
  {
    title: 'Beginner-friendly movement',
    href: '/communities',
    image: '/images/hero/meditation.png',
    meta: 'Yoga, mobility, recovery',
    signal: 'Beginner',
  },
  {
    title: 'Social games and groups',
    href: '/communities',
    image: '/images/community-bonds.jpg',
    meta: 'Pickleball, padel, casual sports',
    signal: 'Social',
  },
]

const buttonBase =
  'min-w-0 touch-manipulation select-none items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6E76A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D0C]'

const compactButtonBase = `${buttonBase} min-h-11 min-w-11`
const touchButtonBase = `${buttonBase} min-h-12`

export default async function HomePage() {
  const now = new Date()
  const publicCommunitySeeds = getPublicCommunitySeeds()
  const beginnerCommunityCount = publicCommunitySeeds.filter((community) => community.beginnerFriendly).length
  const soloCommunityCount = publicCommunitySeeds.filter((community) => community.soloFriendly).length
  const upcomingSessions = await prisma.activity
    .findMany({
      where: {
        status: 'PUBLISHED',
        moderationStatus: 'LIVE',
        deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        startTime: { gte: now },
      },
      select: {
        id: true,
        title: true,
        startTime: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        categorySlug: true,
        imageUrl: true,
        placeId: true,
        price: true,
        currency: true,
        fitnessLevel: true,
        maxPeople: true,
        user: { select: { name: true } },
        host: { select: { name: true } },
        community: { select: { name: true, slug: true, logoImage: true, coverImage: true } },
        _count: {
          select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { startTime: 'asc' }, { id: 'asc' }],
      take: 8,
    })
    .catch((error) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('Failed to load homepage sessions:', error)
      }
      return []
    })

  const sessionMediaById = await resolveSessionMediaMap(upcomingSessions)
  const featuredSessions = upcomingSessions.slice(0, 6)
  const peopleGoingCount = featuredSessions.reduce(
    (sum, session) => sum + session._count.userActivities,
    0,
  )
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0D0C] font-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0D0C]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            aria-label="SweatBuddies home"
            className="inline-flex min-h-11 min-w-11 items-center"
          >
            <LogoWithText
              size={30}
              color="#FFFFFF"
              textColor="#FFFFFF"
              wordmarkClassName="max-[360px]:hidden"
            />
          </Link>
          <p className="hidden min-w-0 flex-1 truncate text-sm font-semibold uppercase tracking-[0.18em] text-white/44 lg:block">
            Fitness community directory
          </p>
          <nav className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <TrackedLink
              href="/communities"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_find_communities', destination: '/communities' }}
              className={`${compactButtonBase} hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/62 hover:border-white/30 hover:text-white sm:inline-flex`}
            >
              Find communities
            </TrackedLink>
            <TrackedLink
              href="/communities/nominate"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_list_community', destination: '/communities/nominate' }}
              aria-label="List your community"
              className={`${compactButtonBase} rounded-full bg-[#C6E76A] px-3 py-2.5 text-[11px] font-bold uppercase text-black hover:bg-[#D8F18A] min-[420px]:px-4 sm:px-5 sm:text-xs`}
            >
              <span aria-hidden="true" className="sm:hidden">List</span>
              <span aria-hidden="true" className="hidden sm:inline">List community</span>
            </TrackedLink>
          </nav>
        </div>
      </header>

      <main>
        <CityGuideTabs active="communities" />

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl">
            <div className="min-w-0 bg-[#0B0D0C]">
              <div className="border-b border-white/10 p-4 sm:p-6">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#C6E76A]">
                  Find communities near you
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
                  Find fitness communities you can actually join.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-base">
                  Browse run clubs, yoga groups, games, and wellness communities by area, vibe,
                  schedule, and beginner-friendliness.
                </p>
                <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                  Global submissions open · {publicCommunitySeeds.length} Singapore seed communities · {beginnerCommunityCount} beginner-friendly · {soloCommunityCount} solo-friendly
                </p>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <TrackedLink
                    href="/communities"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'homepage_primary_find_communities', destination: '/communities' }}
                    className={`${touchButtonBase} inline-flex flex-1 gap-2 rounded-full bg-[#C6E76A] px-5 py-3 text-sm font-bold text-black hover:bg-[#D8F18A]`}
                  >
                    Find communities near me <ArrowRight size={17} className="shrink-0" />
                  </TrackedLink>
                  <TrackedLink
                    href="/communities/nominate"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'homepage_primary_list_community', destination: '/communities/nominate' }}
                    className={`${touchButtonBase} inline-flex gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/72 hover:border-[#C6E76A] hover:text-[#C6E76A]`}
                  >
                    List your community
                  </TrackedLink>
                </div>
              </div>

              <div className="border-b border-white/10 p-4 sm:p-6">
                <TrackedLink
                  href="/communities"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'homepage_community_search', destination: '/communities' }}
                  className={`${touchButtonBase} flex gap-3 rounded-xl border border-white/15 bg-[#111412] px-4 text-left text-sm font-semibold text-white/52 hover:border-white/35 hover:text-white`}
                >
                  <Search size={18} strokeWidth={2.4} className="shrink-0" />
                  <span className="min-w-0 truncate">
                    Search communities, activities, or areas...
                  </span>
                </TrackedLink>

                <div className="mt-3 flex flex-wrap gap-2">
                  {decisionFilters.map((filter) => (
                    <DiscoveryPill
                      key={`${filter.label}-${filter.href}`}
                      href={filter.href}
                      label={filter.label}
                      placement="homepage_decision_filter"
                    />
                  ))}
                </div>

                <div className="mt-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#C6E76A]">
                        Good first clicks
                      </p>
                      <h2 className="mt-1 text-lg font-semibold leading-tight text-white">
                        Communities with the least guesswork
                      </h2>
                    </div>
                    <TrackedLink
                      href="/communities"
                      event={EVENTS.LANDING_CTA_CLICKED}
                      metadata={{ placement: 'homepage_hero_view_all_communities', destination: '/communities' }}
                      className="hidden min-h-10 shrink-0 items-center rounded-full px-2 font-mono text-[11px] font-bold uppercase text-white/48 hover:text-[#C6E76A] sm:inline-flex"
                    >
                      See all
                    </TrackedLink>
                  </div>

                  <div className="grid gap-3">
                    {fallbackPlanCards.map((card) => (
                      <FallbackPlanCard key={card.title} card={card} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
                      Browse by intent
                    </p>
                    <h2 className="mt-1 text-lg font-semibold text-white">Start with a lane</h2>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {activityFilters.slice(0, 5).map((filter) => (
                    <DiscoveryPill
                      key={`${filter.label}-${filter.href}`}
                      href={filter.href}
                      label={filter.label}
                      placement="homepage_community_quick_filter"
                    />
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <SignalBlock
                    title="Communities first"
                    description="Start with active crews, hosts, schedules, and joining signals."
                  />
                  <SignalBlock
                    title="Any city"
                    description="Nominate a crew wherever you train; Singapore is the first dense supply base."
                  />
                  <SignalBlock
                    title="Plans next"
                    description="When a community has joinable plans, they surface as the next best click."
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-white/42">
                  Plans layer
                </p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Upcoming plans people can join
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
                  {peopleGoingCount > 0
                    ? `${peopleGoingCount} people are marked as joining featured plans.`
                    : 'New plans are being verified now. Start with the directory or suggest a community.'}
                </p>
              </div>
              <TrackedLink
                href="/buddy?view=list&location=nearby"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'homepage_events_view_all', destination: '/buddy?view=list&location=nearby' }}
                className={`${compactButtonBase} inline-flex w-fit gap-1.5 rounded-full border border-white/10 px-3 py-2 font-mono text-xs font-bold uppercase text-white/60 hover:border-[#C6E76A] hover:text-[#C6E76A]`}
              >
                Find plans <ArrowRight size={14} className="shrink-0" />
              </TrackedLink>
            </div>

            {featuredSessions.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {featuredSessions.map((session, index) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    resolvedMedia={sessionMediaById.get(session.id)}
                    priority={index === 0}
                    compact={false}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#111412] p-8">
                <h2 className="text-2xl font-semibold text-white">New plans are being verified now.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/58">
                  Browse the community directory now or suggest a community we should review.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#FFFFFF" textColor="#999999" />
            <span className="text-xs text-white/45">&copy; 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-white/48">
            <Link href="/communities" className="transition-colors hover:text-white">
              Communities
            </Link>
            <Link href="/buddy?view=list&location=nearby" className="transition-colors hover:text-white">
              Plans
            </Link>
            <Link href="/communities/nominate" className="transition-colors hover:text-white">
              List community
            </Link>
            <Link href="/support" className="transition-colors hover:text-white">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SignalBlock({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111412] p-4">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-white/56">{description}</p>
    </div>
  )
}

function FallbackPlanCard({
  card,
}: {
  card: {
    title: string
    href: string
    image: string
    meta: string
    signal: string
  }
}) {
  return (
    <TrackedLink
      href={card.href}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement: 'homepage_fallback_plan_card', destination: card.href, title: card.title }}
      className="group grid grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-xl border border-white/10 bg-[#151816] transition-colors hover:border-[#C6E76A]"
    >
      <div className="relative aspect-square overflow-hidden bg-[#222222]">
        <Image
          src={card.image}
          alt={card.title}
          fill
          sizes="118px"
          className="object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/8 to-transparent" />
      </div>
      <div className="grid min-w-0 content-between gap-2 p-3">
        <div>
          <span className="rounded-md bg-[#C6E76A] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-wide text-black">
            {card.signal}
          </span>
          <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-white">
            {card.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-white/58">
            {card.meta}
          </p>
        </div>
        <p className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#C6E76A]">
          View communities <ArrowRight size={12} />
        </p>
      </div>
    </TrackedLink>
  )
}

function DiscoveryPill({
  href,
  label,
  placement,
}: {
  href: string
  label: string
  placement: string
}) {
  return (
    <TrackedLink
      href={href}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement, destination: href, label }}
      className={`${compactButtonBase} inline-flex snap-start shrink-0 rounded-md border border-white/15 bg-[#151816] px-3 py-2 font-mono text-[11px] font-bold uppercase text-white/60 hover:border-[#C6E76A] hover:text-[#C6E76A] sm:px-3.5 sm:text-xs`}
    >
      <span className="max-w-[9.5rem] truncate">{label}</span>
    </TrackedLink>
  )
}

function SessionCard({
  session,
  resolvedMedia,
  priority = false,
  compact = false,
}: {
  session: {
    id: string
    title: string
    startTime: Date | null
    city: string
    address: string | null
    latitude: number | null
    longitude: number | null
    categorySlug: string | null
    imageUrl: string | null
    resolvedImageUrl?: string | null
    imageSourceLabel?: string | null
    price: number
    currency: string
    fitnessLevel: string | null
    maxPeople: number | null
    user: { name: string | null } | null
    host: { name: string | null } | null
    community: {
      name: string | null
      slug: string | null
      logoImage?: string | null
      coverImage?: string | null
    } | null
    _count: { userActivities: number }
  }
  resolvedMedia?: ResolvedSessionMedia
  priority?: boolean
  compact?: boolean
}) {
  const category = cleanText(session.categorySlug || 'fitness')
  const imageSrc =
    resolvedMedia?.resolvedImageUrl ||
    session.resolvedImageUrl ||
    session.imageUrl ||
    getCategoryFallbackImage(category)
  const imageSourceLabel =
    resolvedMedia?.imageSourceLabel || session.imageSourceLabel || (session.imageUrl ? 'Session photo' : null)
  const location = cleanText(session.address?.split(',')[0] || session.city)
  const communityName = cleanText(
    session.community?.name || session.host?.name || session.user?.name || 'Local host',
  )
  const listingStatus = session.community?.name ? 'Verified host' : 'Host listing'
  const priceLabel = formatPrice(session.price, session.currency)
  const activityLabel = formatCategory(category)
  const attendanceLabel =
    session._count.userActivities > 0
      ? `${session._count.userActivities} going`
      : session.maxPeople
        ? `${session.maxPeople} spots`
        : 'Open spots'

  return (
    <TrackedLink
      id={`session-${session.id}`}
      href={`/activities/${session.id}`}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{
        placement: 'homepage_listing_card',
        destination: `/activities/${session.id}`,
        sessionId: session.id,
      }}
      className={
        compact
          ? 'group grid scroll-mt-24 grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-xl border border-white/10 bg-[#151816] transition-all target:border-[#C6E76A] target:ring-2 target:ring-[#C6E76A] hover:border-[#C6E76A] sm:block sm:hover:-translate-y-0.5'
          : 'group scroll-mt-24 overflow-hidden rounded-xl border border-white/10 bg-[#151816] transition-all target:border-[#C6E76A] target:ring-2 target:ring-[#C6E76A] hover:-translate-y-0.5 hover:border-[#C6E76A]'
      }
    >
      <div
        className={
          compact
            ? 'relative aspect-square self-start overflow-hidden bg-[#222222] sm:aspect-[4/3]'
            : 'relative aspect-[4/3] overflow-hidden bg-[#222222]'
        }
      >
        <Image
          src={imageSrc}
          alt={cleanText(session.title)}
          fill
          sizes={
            compact
              ? '(min-width: 640px) 45vw, 118px'
              : '(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw'
          }
          className="object-cover opacity-86 transition-transform duration-500 group-hover:scale-105"
          unoptimized={imageSrc.startsWith('/api/') || imageSrc.startsWith('http')}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div
          className={
            compact
              ? 'absolute left-3 top-3 rounded-md bg-black/52 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur sm:left-4 sm:top-4 sm:px-2.5 sm:text-xs'
              : 'absolute left-4 top-4 rounded-md bg-black/52 px-2.5 py-1 font-mono text-xs font-bold uppercase text-white/86 backdrop-blur'
          }
        >
          {activityLabel}
        </div>
        <div
          className={
            compact
              ? 'absolute right-3 top-3 rounded-md bg-[#C6E76A] px-2 py-1 font-mono text-[10px] font-bold uppercase text-black shadow-md sm:right-4 sm:top-4 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs'
              : 'absolute right-4 top-4 rounded-lg bg-[#C6E76A] px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-black shadow-md'
          }
        >
          {priceLabel}
        </div>
        <div
          className={
            compact
              ? 'hidden rounded-md bg-black/48 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur sm:absolute sm:bottom-4 sm:left-4 sm:block sm:px-2.5 sm:text-xs'
              : 'absolute bottom-4 left-4 rounded-md bg-black/48 px-2.5 py-1 font-mono text-xs font-bold uppercase text-white/86 backdrop-blur'
          }
        >
          {listingStatus}
        </div>
        {imageSourceLabel ? (
          <div
            className={
              compact
                ? 'hidden rounded-md bg-black/48 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur sm:absolute sm:bottom-4 sm:right-4 sm:block sm:text-xs'
                : 'absolute bottom-4 right-4 rounded-md bg-black/48 px-2.5 py-1 font-mono text-xs font-bold uppercase text-white/86 backdrop-blur'
            }
          >
            {imageSourceLabel}
          </div>
        ) : (
          <div
            className={
              compact
                ? 'hidden font-mono text-[10px] font-bold uppercase text-white drop-shadow-md sm:absolute sm:bottom-4 sm:right-4 sm:block sm:text-xs'
                : 'absolute bottom-4 right-4 font-mono text-xs font-bold uppercase text-white drop-shadow-md'
            }
          >
            View details
          </div>
        )}
      </div>
      <div
        className={
          compact
            ? 'grid min-w-0 content-between gap-1.5 p-3 text-xs font-bold text-white/58 sm:gap-2'
            : 'grid gap-2 p-3 text-xs font-bold text-white/58'
        }
      >
        <h3
          className={
            compact
              ? 'line-clamp-2 text-sm font-semibold leading-tight text-white'
              : 'line-clamp-2 text-base font-semibold leading-tight text-white'
          }
        >
          {cleanText(session.title)}
        </h3>
        <p className="line-clamp-2 text-white/68">Hosted by {communityName}</p>
        <p className="flex items-center gap-2 truncate">
          <CalendarDays size={14} strokeWidth={2.2} className="shrink-0 text-[#C6E76A]" />
          <span className="truncate">{formatSessionTime(session.startTime, session.city)}</span>
        </p>
        <p className="flex items-center gap-2 truncate">
          <MapPin size={14} strokeWidth={2.2} className="shrink-0 text-[#C6E76A]" />
          <span className="truncate">{location}</span>
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <Users size={13} strokeWidth={2.4} className="shrink-0 text-[#C6E76A]" />
            {attendanceLabel}
          </span>
          <span className="truncate">{formatLevel(session.fitnessLevel)}</span>
        </div>
      </div>
    </TrackedLink>
  )
}

function formatSessionTime(date: Date | null, city: string): string {
  if (!date) return 'Time TBA'
  const timezone = city.toLowerCase().includes('bangkok') ? 'Asia/Bangkok' : 'Asia/Singapore'
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: timezone,
  })
}

function formatPrice(price: number, currency: string): string {
  if (!price) return 'Free'
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(price / 100)
  } catch {
    return `${currency} ${Math.round(price / 100)}`
  }
}

function formatCategory(category: string): string {
  return category.replace(/[-_]/g, ' ')
}

function formatLevel(level: string | null): string {
  if (!level || level === 'ALL') return 'All levels'
  return formatCategory(level).toLowerCase()
}

function cleanText(value: string): string {
  return value
    .replace(/\uFFFD+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
