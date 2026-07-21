import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import { ArrowRight, CalendarDays, MapPin, Search, Star, Users } from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { CityGuideTabs } from '@/components/city-guide/CityGuideTabs'
import { PlaceCoverImage } from '@/components/fitness-directory/PlaceCoverImage'
import {
  LazySessionVectorMap,
  type SessionVectorMapPin,
} from '@/components/maps/LazySessionVectorMap'
import { EVENTS } from '@/lib/analytics'
import { getActivityEmoji } from '@/lib/activity-types'
import {
  fitnessDirectoryCategories,
  formatPlaceType,
  getDirectoryStats,
  getFitnessPlacePositioning,
  getFitnessPlacesForCategory,
  type FitnessPlace,
} from '@/lib/fitness-directory'
import { getFitnessDirectoryPlaces } from '@/lib/fitness-place-store'
import { resolveSessionMediaMap, type ResolvedSessionMedia } from '@/lib/session-media'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'SweatBuddies - Fitness City Guides and Social Fitness Events',
  description:
    'Find where to show up, who it suits, and the easiest path to join social fitness in Singapore.',
}

const activityFilters = [
  { label: 'Run / Walk', href: '/buddy?location=nearby&type=running' },
  { label: 'Soft Entry', href: '/buddy?location=nearby&type=yoga' },
  { label: 'Pickleball', href: '/buddy?location=nearby&type=pickleball' },
  { label: 'Strength', href: '/buddy?location=nearby&type=strength' },
  { label: 'Outdoor', href: '/buddy?location=nearby&type=hiking' },
  { label: 'Crews', href: '/communities' },
]

const fallbackImages: Record<string, string> = {
  running: '/banner/running.jpg',
  run: '/banner/running.jpg',
  yoga: '/images/hero-bg.jpg',
  pickleball: '/images/community-bonds.jpg',
  strength: '/banner/athletics.jpg',
  hiit: '/images/connect-people.webp',
  recovery: '/banner/ice-bath.webp',
  social: '/images/hosts/run-club-group.jpg',
}

const buttonBase =
  'min-w-0 touch-manipulation select-none items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63FF8F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B]'

const compactButtonBase = `${buttonBase} min-h-11 min-w-11`
const touchButtonBase = `${buttonBase} min-h-12`

export default async function HomePage() {
  const now = new Date()
  const directoryPlaces = await getFitnessDirectoryPlaces()
  const directoryStats = getDirectoryStats(directoryPlaces)
  const categorySummaries = fitnessDirectoryCategories.map((category) => ({
    ...category,
    count: getFitnessPlacesForCategory(category.slug, {}, directoryPlaces).length,
  }))
  const trustedImportedPlaces = directoryPlaces
    .filter((place) => place.sourceProvider || place.websiteUrl)
    .sort((a, b) => getFitnessPlacePositioning(b).score - getFitnessPlacePositioning(a).score || a.name.localeCompare(b.name))
  const seededHighlights = directoryPlaces
    .filter((place) => !place.sourceProvider && !place.websiteUrl)
    .sort((a, b) => b.socialScore - a.socialScore || b.reviewCount - a.reviewCount || a.name.localeCompare(b.name))
  const featuredPlaces = [...trustedImportedPlaces.slice(0, 6), ...seededHighlights.slice(0, 2)]
  const mapPlaces = featuredPlaces.filter((place) => place.latitude && place.longitude).slice(0, 24)
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
  const inventoryItems = [
    { label: `${directoryStats.places} places`, value: directoryStats.places, shortLabel: 'Places' },
    { label: `${directoryStats.activities} activities`, value: directoryStats.activities, shortLabel: 'Activities' },
    { label: `${directoryStats.areas} areas`, value: directoryStats.areas, shortLabel: 'Areas' },
    { label: `${directoryStats.socialPlaces} social picks`, value: directoryStats.socialPlaces, shortLabel: 'Social picks' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0B0B] font-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl">
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
            Fitness city guides
          </p>
          <nav className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <TrackedLink
              href="/buddy?location=nearby"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_find_plans', destination: '/buddy?location=nearby' }}
              className={`${compactButtonBase} hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/62 hover:border-white/30 hover:text-white sm:inline-flex`}
            >
              Find plans
            </TrackedLink>
            <TrackedLink
              href="/host"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_host', destination: '/host' }}
              className={`${compactButtonBase} rounded-full bg-[#63FF8F] px-3 py-2.5 text-[11px] font-bold uppercase text-black hover:bg-[#83FFA6] min-[420px]:px-4 sm:px-5 sm:text-xs`}
            >
              <span className="sm:hidden">Host</span>
              <span className="hidden sm:inline">Host a session</span>
            </TrackedLink>
          </nav>
        </div>
      </header>

      <main>
        <CityGuideTabs active="events" />

        <section className="border-b border-white/10">
          <div className="mx-auto grid max-w-[1920px] gap-0 lg:min-h-[calc(100vh-126px)] lg:grid-cols-[minmax(420px,42vw)_1fr]">
            <div className="min-w-0 border-r border-white/10 bg-[#0B0B0B]">
              <div className="border-b border-white/10 p-4 sm:p-6">
                <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-[#63FF8F]">
                  SweatBuddies discovery
                </p>
                <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-5xl">
                  Fitness plans where showing up solo feels normal.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-white/62 sm:text-base">
                  Find nearby runs, classes, games, and recovery sessions with people going,
                  clear expectations, and crews you can come back to.
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {inventoryItems.map((item) => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-2xl font-semibold leading-none text-white">{item.value}</p>
                      <p className="mt-2 truncate font-mono text-[10px] font-bold uppercase text-white/52 sm:text-[11px]">
                        {item.shortLabel}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <TrackedLink
                    href="/buddy?location=nearby"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'homepage_primary_find_plans', destination: '/buddy?location=nearby' }}
                    className={`${touchButtonBase} inline-flex flex-1 gap-2 rounded-full bg-[#63FF8F] px-5 py-3 text-sm font-bold text-black hover:bg-[#83FFA6]`}
                  >
                    Find plans <ArrowRight size={17} className="shrink-0" />
                  </TrackedLink>
                  <TrackedLink
                    href="/buddy?view=map&location=nearby"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'homepage_primary_open_map', destination: '/buddy?view=map&location=nearby' }}
                    className={`${touchButtonBase} inline-flex gap-2 rounded-full border border-white/12 px-5 py-3 text-sm font-bold text-white/72 hover:border-[#63FF8F] hover:text-[#63FF8F]`}
                  >
                    Open map
                  </TrackedLink>
                </div>
              </div>

              <div className="border-b border-white/10 p-4 sm:p-6">
                <TrackedLink
                  href="/buddy?location=nearby"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'homepage_plan_search', destination: '/buddy?location=nearby' }}
                  className={`${touchButtonBase} flex gap-3 rounded-xl border border-white/15 bg-[#111111] px-4 text-left text-sm font-semibold text-white/52 hover:border-white/35 hover:text-white`}
                >
                  <Search size={18} strokeWidth={2.4} className="shrink-0" />
                  <span className="min-w-0 truncate">
                    Search plans, crews, activity, or neighborhood...
                  </span>
                </TrackedLink>

                <div className="mt-3 flex flex-wrap gap-2">
                  {activityFilters.slice(0, 5).map((filter) => (
                    <DiscoveryPill
                      key={`${filter.label}-${filter.href}`}
                      href={filter.href}
                      label={filter.label}
                      placement="homepage_place_quick_filter"
                    />
                  ))}
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {categorySummaries.slice(1).map((category) => (
                    <CategoryCard
                      key={category.slug}
                      href={category.href}
                      title={category.shortTitle}
                      description={category.description}
                      count={category.count}
                    />
                  ))}
                </div>
              </div>
            </div>

            <DirectoryMapPreview places={mapPlaces} />
          </div>
        </section>

        <section className="border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-wide text-white/42">
                  Confidence layer
                </p>
                <h2 className="mt-1 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                  Places that make joining easier
                </h2>
              </div>
              <TrackedLink
                href="/singapore"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'homepage_places_view_all', destination: '/singapore' }}
                className={`${compactButtonBase} inline-flex w-fit gap-1.5 rounded-full border border-white/10 px-3 py-2 font-mono text-xs font-bold uppercase text-white/60 hover:border-[#63FF8F] hover:text-[#63FF8F]`}
              >
                View all <ArrowRight size={14} className="shrink-0" />
              </TrackedLink>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featuredPlaces.slice(0, 8).map((place) => (
                <HomePlaceCard key={place.slug} place={place} />
              ))}
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
                  {peopleGoingCount} people are currently marked as joining featured sessions.
                </p>
              </div>
              <TrackedLink
                href="/buddy?location=nearby"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'homepage_events_view_all', destination: '/buddy?location=nearby' }}
                className={`${compactButtonBase} inline-flex w-fit gap-1.5 rounded-full border border-white/10 px-3 py-2 font-mono text-xs font-bold uppercase text-white/60 hover:border-[#63FF8F] hover:text-[#63FF8F]`}
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
              <div className="rounded-xl border border-white/10 bg-[#111111] p-8">
                <h2 className="text-2xl font-semibold text-white">New events are being mapped.</h2>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/58">
                  Browse the city guide now or submit a host page for review.
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
            <Link href="/singapore" className="transition-colors hover:text-white">
              Guide
            </Link>
            <Link href="/singapore" className="transition-colors hover:text-white">
              Singapore
            </Link>
            <Link href="/bangkok" className="transition-colors hover:text-white">
              Bangkok
            </Link>
            <Link href="/host" className="transition-colors hover:text-white">
              For hosts
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

function CategoryCard({
  href,
  title,
  description,
  count,
}: {
  href: string
  title: string
  description: string
  count: number
}) {
  return (
    <TrackedLink
      href={href}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement: 'homepage_category_card', destination: href, category: title }}
      className="group rounded-xl border border-white/10 bg-[#111111] p-4 transition-colors hover:border-[#63FF8F]"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <span className="rounded-full bg-white px-2 py-1 font-mono text-[11px] font-bold uppercase text-black">
          {count}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/56">{description}</p>
      <p className="mt-4 inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[#63FF8F]">
        Browse <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </p>
    </TrackedLink>
  )
}

function HomePlaceCard({ place }: { place: FitnessPlace }) {
  const positioning = getFitnessPlacePositioning(place)

  return (
    <TrackedLink
      href={`/places/${place.slug}`}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement: 'homepage_place_card', destination: `/places/${place.slug}`, place: place.slug }}
      className="group overflow-hidden rounded-xl border border-white/10 bg-[#111111] transition-all hover:-translate-y-0.5 hover:border-[#63FF8F]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#222222]">
        <PlaceCoverImage
          src={place.coverImage}
          alt=""
          sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-86 transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-black/20 to-transparent" />
        <div className="absolute left-3 top-3 rounded-md bg-black/52 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur">
          {positioning.joinPath}
        </div>
        <div className="absolute bottom-3 left-3 right-3">
          <p className="font-mono text-[10px] font-bold uppercase text-[#63FF8F]">{place.area}</p>
          <h3 className="mt-1 line-clamp-2 text-lg font-semibold leading-tight text-white">
            {place.name}
          </h3>
        </div>
      </div>
      <div className="grid gap-3 p-4">
        <p className="line-clamp-2 text-sm leading-6 text-white/62">{positioning.reason}</p>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs font-bold text-white/48">
          <span className="inline-flex min-w-0 items-center gap-1 truncate">
            <Star size={13} fill="currentColor" className="shrink-0 text-[#63FF8F]" />
            {positioning.score}
          </span>
          <span className="truncate">{positioning.socialSignal} signal</span>
        </div>
      </div>
    </TrackedLink>
  )
}

function DirectoryMapPreview({ places }: { places: FitnessPlace[] }) {
  const pins: SessionVectorMapPin[] = places.map((place) => ({
    id: place.slug,
    title: cleanText(place.name),
    latitude: place.latitude,
    longitude: place.longitude,
    city: place.city,
    primaryLabel: formatPlaceType(place.placeType),
    priceLabel: place.dropInFriendly ? 'Drop-in' : undefined,
    activityLabel: place.activities[0] ? getActivityEmoji(place.activities[0], '📍') : '📍',
    previewTitle: cleanText(place.name),
    previewSubtitle: place.bestFor,
    previewMeta: place.area,
    previewImage: place.coverImage,
    previewCtaLabel: 'Open place',
    href: `/places/${place.slug}`,
  }))
  const spotlight = places[0]

  return (
    <div className="relative hidden min-h-[560px] overflow-hidden bg-[#191919] lg:block">
      <LazySessionVectorMap
        center={{ lat: 1.3521, lng: 103.8198 }}
        pins={pins}
        initialZoom={10.6}
        maxFitZoom={12.5}
        fitPadding={92}
      />
      <div className="absolute left-5 top-5 z-10 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs font-bold uppercase text-white/72 backdrop-blur">
        {pins.length} featured place pins
      </div>
      <div className="absolute bottom-5 left-5 z-10 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs font-bold text-white/58 backdrop-blur">
        Singapore · gyms, studios, sports, community spaces
      </div>
      <div className="absolute bottom-5 right-5 z-10">
        <TrackedLink
          href="/singapore"
          event={EVENTS.LANDING_CTA_CLICKED}
          metadata={{ placement: 'homepage_place_map_open_directory', destination: '/singapore' }}
          className={`${touchButtonBase} inline-flex gap-1.5 rounded-full bg-[#63FF8F] px-4 py-3 font-mono text-xs font-bold uppercase text-black shadow-[0_12px_34px_rgba(0,0,0,0.32)] hover:bg-[#83FFA6]`}
        >
          Open guide <ArrowRight size={14} className="shrink-0" />
        </TrackedLink>
      </div>

      {spotlight ? (
        <div className="absolute left-5 right-5 top-16 z-10 max-w-sm rounded-xl border border-white/10 bg-black/55 p-4 shadow-2xl shadow-black/30 backdrop-blur md:top-auto md:bottom-20 md:right-auto">
          <p className="font-mono text-[10px] font-bold uppercase text-[#63FF8F]">Featured place</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight text-white">
            {spotlight.name}
          </h3>
          <div className="mt-3 grid gap-2 text-xs font-bold text-white/62">
            <p className="flex items-center gap-2 truncate">
              <MapPin size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
              <span className="truncate">{spotlight.address || spotlight.area}</span>
            </p>
            <p className="flex items-center gap-2 truncate">
              <Users size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
              <span className="truncate">{spotlight.bestFor}</span>
            </p>
          </div>
          <TrackedLink
            href={`/places/${spotlight.slug}`}
            event={EVENTS.LANDING_CTA_CLICKED}
            metadata={{ placement: 'homepage_map_featured_place', destination: `/places/${spotlight.slug}` }}
            className={`${compactButtonBase} mt-4 inline-flex gap-1.5 rounded-full bg-white px-3 py-2 font-mono text-[11px] font-bold uppercase text-black hover:bg-[#63FF8F]`}
          >
            Details <ArrowRight size={13} className="shrink-0" />
          </TrackedLink>
        </div>
      ) : null}
    </div>
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
      className={`${compactButtonBase} inline-flex snap-start shrink-0 rounded-md border border-white/15 bg-[#151515] px-3 py-2 font-mono text-[11px] font-bold uppercase text-white/60 hover:border-[#63FF8F] hover:text-[#63FF8F] sm:px-3.5 sm:text-xs`}
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
    fallbackImages[category.toLowerCase()] ||
    '/images/hero-bg.jpg'
  const imageSourceLabel =
    resolvedMedia?.imageSourceLabel || session.imageSourceLabel || (session.imageUrl ? 'Session photo' : null)
  const location = cleanText(session.address?.split(',')[0] || session.city)
  const communityName = cleanText(
    session.community?.name || session.host?.name || session.user?.name || 'Local host',
  )
  const listingStatus = session.community?.name ? 'Verified host' : 'Host listing'
  const priceLabel = formatPrice(session.price, session.currency)
  const activityLabel = formatCategory(category)

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
          ? 'group grid scroll-mt-24 grid-cols-[118px_minmax(0,1fr)] overflow-hidden rounded-xl border border-white/10 bg-[#151515] transition-all target:border-[#63FF8F] target:ring-2 target:ring-[#63FF8F] hover:border-[#63FF8F] sm:block sm:hover:-translate-y-0.5'
          : 'group scroll-mt-24 overflow-hidden rounded-xl border border-white/10 bg-[#151515] transition-all target:border-[#63FF8F] target:ring-2 target:ring-[#63FF8F] hover:-translate-y-0.5 hover:border-[#63FF8F]'
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
              ? 'absolute right-3 top-3 rounded-md bg-[#63FF8F] px-2 py-1 font-mono text-[10px] font-bold uppercase text-black shadow-md sm:right-4 sm:top-4 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs'
              : 'absolute right-4 top-4 rounded-lg bg-[#63FF8F] px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-black shadow-md'
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
          <CalendarDays size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
          <span className="truncate">{formatSessionTime(session.startTime, session.city)}</span>
        </p>
        <p className="flex items-center gap-2 truncate">
          <MapPin size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
          <span className="truncate">{location}</span>
        </p>
        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-2">
          <span>{cleanText(session.city)}</span>
          <span>{formatLevel(session.fitnessLevel)}</span>
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
