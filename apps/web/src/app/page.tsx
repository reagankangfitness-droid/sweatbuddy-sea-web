import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  ArrowRight,
  CalendarDays,
  Map as MapIcon,
  MapPin,
  Search,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { LandingTopFilterDropdown } from '@/components/landing/LandingTopFilterDropdown'
import { LazySessionVectorMap, type SessionVectorMapPin } from '@/components/maps/LazySessionVectorMap'
import { EVENTS } from '@/lib/analytics'
import { getActivityEmoji } from '@/lib/activity-types'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies - Social Fitness Events in Bangkok and Singapore',
  description:
    'Find your people through fitness. Discover social fitness and wellness events across Bangkok and Singapore.',
}

const activityFilters = [
  { label: 'Running', href: '/buddy?type=running' },
  { label: 'Yoga', href: '/buddy?type=yoga' },
  { label: 'Pickleball', href: '/buddy?type=pickleball' },
  { label: 'Strength', href: '/buddy?type=strength' },
  { label: 'Recovery', href: '/buddy?type=recovery' },
  { label: 'Social', href: '/buddy?type=social' },
]

const cityFilters = [
  { label: 'Singapore', href: '/buddy?city=singapore' },
  { label: 'Bangkok', href: '/buddy?city=bangkok' },
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

const landingTopFilters = [
  {
    label: 'City',
    value: 'Singapore / Bangkok',
    state: '2 markets',
    href: '/buddy?city=singapore',
  },
  {
    label: 'Activity',
    value: 'Run, yoga, pickleball',
    state: 'Popular',
    href: '/buddy',
  },
  {
    label: 'Filters',
    value: 'Area, price, level',
    state: 'Optional',
    href: '/buddy',
  },
]

const priceFilters = [
  { label: 'Free', href: '/buddy?pricing=free' },
  { label: 'Paid', href: '/buddy?pricing=paid' },
  { label: 'All prices', href: '/buddy' },
]

const levelFilters = [
  { label: 'Beginner-friendly', href: '/buddy?fitnessLevel=ALL' },
  { label: 'Intermediate+', href: '/buddy?fitnessLevel=INTERMEDIATE_PLUS' },
  { label: 'Advanced', href: '/buddy?fitnessLevel=ADVANCED' },
]

export default async function HomePage() {
  const now = new Date()
  const topFilters = landingTopFilters.map((filter) => {
    if (filter.label === 'City') return { ...filter, options: cityFilters }
    if (filter.label === 'Activity') return { ...filter, options: activityFilters }
    return {
      ...filter,
      options: [
        { label: 'Free events', href: '/buddy?pricing=free' },
        { label: 'Paid options', href: '/buddy?pricing=paid' },
        { label: 'Beginner-friendly', href: '/buddy?fitnessLevel=ALL' },
        { label: 'Intermediate+', href: '/buddy?fitnessLevel=INTERMEDIATE_PLUS' },
        { label: 'This week', href: '/buddy' },
      ],
    }
  })

  const upcomingSessions = await prisma.activity.findMany({
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
      price: true,
      currency: true,
      fitnessLevel: true,
      maxPeople: true,
      user: { select: { name: true } },
      host: { select: { name: true } },
      community: { select: { name: true, slug: true } },
      _count: {
        select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } },
      },
    },
    orderBy: [{ isFeatured: 'desc' }, { startTime: 'asc' }, { id: 'asc' }],
    take: 8,
  })

  const featuredSessions = upcomingSessions.slice(0, 6)
  const availabilityItems = [
    { label: 'Singapore + Bangkok', shortLabel: 'SG + BKK' },
    { label: 'People already going', shortLabel: 'Live people' },
    { label: 'Solo-friendly starts', shortLabel: 'Solo-friendly' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B0B0B] font-sans text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0B0B]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1920px] items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="SweatBuddies home" className="inline-flex min-h-11 items-center">
            <LogoWithText size={30} color="#FFFFFF" textColor="#FFFFFF" />
          </Link>
          <p className="hidden min-w-0 flex-1 truncate text-sm font-semibold text-white/64 lg:block">
            Find your people through fitness and wellness events
          </p>
          <nav className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
            <TrackedLink
              href="/buddy"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_explore', destination: '/buddy' }}
              className={`${compactButtonBase} hidden rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase text-white/62 hover:border-white/30 hover:text-white sm:inline-flex`}
            >
              Explore events
            </TrackedLink>
            <TrackedLink
              href="/buddy?create=session"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_host_event', destination: '/buddy?create=session' }}
              className={`${compactButtonBase} rounded-full bg-[#63FF8F] px-3 py-2.5 text-[11px] font-bold uppercase text-black hover:bg-[#83FFA6] min-[420px]:px-4 sm:px-5 sm:text-xs`}
            >
              <span className="sm:hidden">Host</span>
              <span className="hidden sm:inline">Host an event</span>
            </TrackedLink>
          </nav>
        </div>
      </header>

      <main>
        <section className="sticky top-[69px] isolate z-[90] border-b border-white/10 bg-[#0F0F0F]/96 px-3 py-2 backdrop-blur-xl lg:relative lg:top-auto lg:px-3 lg:py-3">
          <div className="grid gap-2 lg:hidden">
            <TrackedLink
              href="/buddy"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'mobile_marketplace_search', destination: '/buddy' }}
              className={`${compactButtonBase} flex gap-3 rounded-xl border border-white/15 bg-[#111111] px-3 text-left text-xs font-semibold text-white/56 hover:border-white/35 hover:text-white`}
            >
              <Search size={17} strokeWidth={2.4} className="shrink-0" />
              <span className="min-w-0 truncate">Search events, activities, or neighborhoods...</span>
            </TrackedLink>

            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold uppercase text-white/42">
                  Social fitness map
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">
                  Singapore + Bangkok · people already going
                </p>
              </div>
              <MobileFilterDropdown />
            </div>
          </div>

          <div className="hidden min-w-0 grid-cols-3 gap-2 lg:grid">
            {topFilters.map((filter) => (
              <LandingTopFilterDropdown
                key={filter.label}
                label={filter.label}
                value={filter.value}
                state={filter.state}
                options={filter.options}
              />
            ))}
          </div>
        </section>

        <MobileMapListSwitch sessionCount={featuredSessions.length} />

        <section className="min-h-[calc(100vh-126px)] lg:grid lg:h-[calc(100vh-145px)] lg:min-h-0 lg:grid-cols-[minmax(390px,40vw)_1fr] lg:overflow-hidden">
          <aside id="session-list" className="order-2 scroll-mt-32 min-w-0 border-r border-white/10 bg-[#0B0B0B] lg:order-1 lg:h-full lg:overflow-y-auto lg:overscroll-contain">
            <div className="border-b border-white/10 p-4 sm:p-4">
              <p className="font-mono text-xs font-bold uppercase text-white/42">
                Mapped in Bangkok and Singapore
              </p>
              <h1 className="mt-1 max-w-2xl text-2xl font-semibold leading-tight text-white sm:mt-2 sm:text-4xl">
                Find your people through fitness.
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-white/60 sm:mt-3 sm:block">
                Discover run clubs, yoga, pickleball, strength, recovery, and wellness events.
                See who is going, find solo-friendly sessions, and show up with confidence.
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
                {availabilityItems.map((item) => (
                  <div key={item.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 sm:p-3">
                    <p className="truncate font-mono text-[10px] font-bold uppercase text-white/70 sm:text-[11px]">
                      <span className="min-[380px]:hidden">{item.shortLabel}</span>
                      <span className="hidden min-[380px]:inline">{item.label}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden border-b border-white/10 p-4 sm:block">
              <TrackedLink
                href="/buddy"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'hero_discovery_search', destination: '/buddy' }}
                className={`${touchButtonBase} flex gap-3 rounded-xl border border-white/15 bg-[#111111] px-3 text-left text-xs font-semibold text-white/50 hover:border-white/35 hover:text-white sm:px-4 sm:text-sm`}
              >
                <Search size={18} strokeWidth={2.4} className="shrink-0" />
                <span className="min-w-0 truncate">
                  Search events by activity, host, or neighborhood...
                </span>
              </TrackedLink>

              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
                {[...cityFilters, ...activityFilters.slice(0, 5)].map((filter) => (
                  <DiscoveryPill
                    key={`${filter.label}-${filter.href}`}
                    href={filter.href}
                    label={filter.label}
                    placement="hero_quick_filter"
                  />
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase text-white/42 sm:text-xs">
                    Social plans people are joining
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-white sm:text-lg">
                    Start with events that feel alive
                  </h2>
                </div>
                <TrackedLink
                  href="/buddy"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'hero_listing_view_all', destination: '/buddy' }}
                  className={`${compactButtonBase} inline-flex shrink-0 gap-1.5 rounded-full border border-white/10 px-3 py-2 font-mono text-[11px] font-bold uppercase text-white/60 hover:border-[#63FF8F] hover:text-[#63FF8F] sm:text-xs`}
                >
                  <span className="hidden min-[420px]:inline">View all</span>
                  <ArrowRight size={14} className="shrink-0" />
                </TrackedLink>
              </div>

              {featuredSessions.length > 0 ? (
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  {featuredSessions.map((session, index) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      priority={index === 0}
                      compact={index > 0}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-[#111111] p-8">
                  <h2 className="text-2xl font-semibold text-white">
                    New events are being mapped.
                  </h2>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/58">
                    Browse upcoming plans now or add a host page for review.
                  </p>
                  <TrackedLink
                    href="/buddy"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'hero_empty_explore', destination: '/buddy' }}
                    className={`${touchButtonBase} mt-6 inline-flex gap-2 rounded-full bg-[#63FF8F] px-5 py-3 text-sm font-bold text-black hover:bg-[#83FFA6]`}
                  >
                    Explore events <ArrowRight size={16} className="shrink-0" />
                  </TrackedLink>
                </div>
              )}
            </div>

            <CompactConversionRail />
          </aside>

          <DiscoveryMapPreview sessions={featuredSessions} />
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#FFFFFF" textColor="#999999" />
            <span className="text-xs text-white/45">&copy; 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-white/48">
            <Link href="/buddy" className="transition-colors hover:text-white">
              Explore
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

function MobileFilterDropdown() {
  const groups = [
    { label: 'City', options: cityFilters },
    { label: 'Activity', options: activityFilters.slice(0, 6) },
    { label: 'Price', options: priceFilters },
    { label: 'Level', options: levelFilters },
  ]

  return (
    <details className="group relative shrink-0 font-mono">
      <summary
        className={`${compactButtonBase} inline-flex cursor-pointer list-none rounded-full border border-white/12 px-3 py-2 text-[11px] font-bold uppercase text-white/72 hover:border-[#63FF8F] hover:text-[#63FF8F] group-open:border-[#63FF8F] group-open:text-[#63FF8F] [&::-webkit-details-marker]:hidden`}
      >
        Filters
      </summary>
      <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(330px,calc(100vw-24px))] rounded-xl border border-white/12 bg-[#111111] p-3 shadow-2xl shadow-black/50">
        <div className="grid gap-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                {group.label}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.options.map((option) => (
                  <TrackedLink
                    key={`mobile-filter-${group.label}-${option.label}-${option.href}`}
                    href={option.href}
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{
                      placement: 'mobile_marketplace_filter_dropdown',
                      destination: option.href,
                      group: group.label,
                      option: option.label,
                    }}
                    className="min-h-11 rounded-md border border-white/10 bg-[#171717] px-2.5 py-2 text-[11px] font-bold uppercase text-white/72 hover:border-[#63FF8F] hover:text-[#63FF8F]"
                  >
                    {option.label}
                  </TrackedLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  )
}

function MobileMapListSwitch({ sessionCount }: { sessionCount: number }) {
  return (
    <div className="border-b border-white/10 bg-[#0B0B0B] px-3 py-2 lg:hidden">
      <TrackedLink
        href="/buddy?view=map"
        event={EVENTS.LANDING_CTA_CLICKED}
        metadata={{
          placement: 'mobile_marketplace_open_map',
          destination: '/buddy?view=map',
          view: 'map',
        }}
        className={`${compactButtonBase} inline-flex w-full gap-2 rounded-xl border border-black/20 bg-[#63FF8F] px-3.5 py-2.5 font-mono text-[11px] font-bold uppercase text-black shadow-lg shadow-black/20 hover:bg-[#83FFA6]`}
        aria-label={`Open map with ${sessionCount} mapped events`}
      >
        <MapIcon size={14} strokeWidth={2.4} className="shrink-0" />
        <span>Open map</span>
      </TrackedLink>
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

function CompactConversionRail() {
  return (
    <div className="border-t border-white/10 p-4 pb-10">
      <div className="border-b border-white/10 pb-5">
        <p className="font-mono text-xs font-bold uppercase text-white/42">
          Browse by activity
        </p>
        <h2 className="mt-1 text-xl font-semibold leading-tight text-white">
          Find the right plan. Tell us what to map next.
        </h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {activityFilters.map((filter) => (
            <TrackedLink
              key={filter.label}
              href={filter.href}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: 'rail_activity_filter',
                destination: filter.href,
                activity: filter.label,
              }}
              className={`${compactButtonBase} inline-flex shrink-0 rounded-md border border-white/15 bg-[#151515] px-3 py-2 font-mono text-xs font-bold text-white/68 hover:border-[#63FF8F] hover:text-[#63FF8F]`}
            >
              {filter.label}
            </TrackedLink>
          ))}
        </div>
      </div>

      <div className="grid gap-6 py-5">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase text-white/42">
            Why people join
          </p>
          <div className="mt-3 grid gap-0 border-y border-white/10">
            {[
              ['Know what you are joining', 'Activity, area, price, people signals, and source links are visible upfront.'],
              ['Start without guessing', 'Find sessions where newcomers and solo arrivals are expected.'],
              ['Return to familiar faces', 'Recurring hosts make consistency easier than starting from zero every week.'],
            ].map(([title, body]) => (
              <div key={title} className="border-b border-white/10 py-3 last:border-b-0">
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-white/58">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="font-mono text-[11px] font-bold uppercase text-white/42">
            Help map the city
          </p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-white">
            Know a host or event we should list?
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Submit the official page, social link, area, and activity. We review it before it appears on the map.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {['Official link', 'Fresh schedule', 'First-timer context'].map((item) => (
              <span
                key={item}
                className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 font-mono text-xs font-bold text-white/72"
              >
                {item}
              </span>
            ))}
          </div>
          <TrackedLink
            href="/communities/create"
            event={EVENTS.LANDING_CTA_CLICKED}
            metadata={{ placement: 'rail_suggest_source', destination: '/communities/create' }}
            className={`${touchButtonBase} mt-5 inline-flex gap-2 rounded-full bg-[#63FF8F] px-5 py-3 text-sm font-bold text-[#111111] hover:bg-[#33E66C]`}
          >
            Submit a source <ArrowRight size={17} className="shrink-0" />
          </TrackedLink>
        </div>
      </div>
    </div>
  )
}

function DiscoveryMapPreview({
  sessions,
}: {
  sessions: Array<{
    id: string
    title: string
    startTime: Date | null
    city: string
    address: string | null
    categorySlug: string | null
    latitude: number | null
    longitude: number | null
    imageUrl?: string | null
    price: number
    currency: string
    _count: { userActivities: number }
  }>
}) {
  const pins = sessions.slice(0, 7)
  const geocodedCount = pins.filter(hasCoordinates).length
  const spotlight = pins[0]
  const mapPins: SessionVectorMapPin[] = pins.map((session) => ({
    id: session.id,
    title: cleanText(session.title),
    latitude: session.latitude,
    longitude: session.longitude,
    city: session.city,
    primaryLabel: formatCategory(cleanText(session.categorySlug || 'fitness')),
    priceLabel: formatPrice(session.price, session.currency),
    activityLabel: getActivityEmoji(session.categorySlug, '🏅'),
    previewTitle: cleanText(session.title),
    previewSubtitle: formatSessionTime(session.startTime, session.city),
    previewMeta: cleanText(session.address?.split(',')[0] || session.city),
    previewImage: session.imageUrl,
    previewCtaLabel: 'Find card',
    href: `#session-${session.id}`,
  }))

  return (
    <div id="map-preview" className="relative order-1 hidden min-h-[520px] scroll-mt-32 min-w-0 overflow-hidden bg-[#191919] text-white target:ring-2 target:ring-[#63FF8F] lg:order-2 lg:block lg:h-full lg:min-h-0 lg:self-stretch">
      <LazySessionVectorMap
        center={{ lat: 7.54, lng: 102.16 }}
        pins={mapPins}
        initialZoom={4.6}
        maxFitZoom={11}
        fitPadding={92}
      />

      <div className="absolute left-5 top-5 z-10 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs font-bold uppercase text-white/72 backdrop-blur">
        {geocodedCount > 0 ? `${geocodedCount} mapped events` : 'Map preview'}
      </div>
      <div className="absolute bottom-5 left-5 z-10 rounded-md border border-white/10 bg-black/35 px-3 py-2 font-mono text-xs font-bold text-white/58 backdrop-blur">
        Singapore + Bangkok · {pins.length} event pins
      </div>
      <div className="absolute bottom-5 right-5 z-10">
        <TrackedLink
          href="/buddy"
          event={EVENTS.LANDING_CTA_CLICKED}
          metadata={{ placement: 'hero_map_preview', destination: '/buddy' }}
          className={`${touchButtonBase} inline-flex gap-1.5 rounded-full bg-[#63FF8F] px-3.5 py-2.5 font-mono text-[11px] font-bold uppercase text-black shadow-[0_12px_34px_rgba(0,0,0,0.32)] hover:bg-[#83FFA6] sm:px-4 sm:py-3 sm:text-xs`}
        >
          <span className="hidden min-[420px]:inline">Open map</span>
          <span className="min-[420px]:hidden">Map</span>
          <ArrowRight size={14} className="shrink-0" />
        </TrackedLink>
      </div>

      {spotlight && (
        <div className="absolute left-5 right-5 top-16 z-10 max-w-sm rounded-xl border border-white/10 bg-black/55 p-4 shadow-2xl shadow-black/30 backdrop-blur md:top-auto md:bottom-20 md:right-auto">
          <p className="font-mono text-[10px] font-bold uppercase text-[#63FF8F]">
            Featured pin
          </p>
          <h3 className="mt-2 line-clamp-2 text-lg font-semibold leading-tight text-white">
            {cleanText(spotlight.title)}
          </h3>
          <div className="mt-3 grid gap-2 text-xs font-bold text-white/62">
            <p className="flex items-center gap-2 truncate">
              <CalendarDays size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
              <span className="truncate">{formatSessionTime(spotlight.startTime, spotlight.city)}</span>
            </p>
            <p className="flex items-center gap-2 truncate">
              <MapPin size={14} strokeWidth={2.2} className="shrink-0 text-[#63FF8F]" />
              <span className="truncate">{cleanText(spotlight.address?.split(',')[0] || spotlight.city)}</span>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrackedLink
              href={`#session-${spotlight.id}`}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: 'hero_map_featured_pin_card_anchor',
                destination: `#session-${spotlight.id}`,
                sessionId: spotlight.id,
              }}
              className={`${compactButtonBase} inline-flex rounded-full border border-white/15 px-3 py-2 font-mono text-[11px] font-bold uppercase text-white/72 hover:border-[#63FF8F] hover:text-[#63FF8F]`}
            >
              Find card
            </TrackedLink>
            <TrackedLink
              href={`/activities/${spotlight.id}`}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: 'hero_map_featured_pin_details',
                destination: `/activities/${spotlight.id}`,
                sessionId: spotlight.id,
              }}
              className={`${compactButtonBase} inline-flex gap-1.5 rounded-full bg-white px-3 py-2 font-mono text-[11px] font-bold uppercase text-black hover:bg-[#63FF8F]`}
            >
              Details <ArrowRight size={13} className="shrink-0" />
            </TrackedLink>
          </div>
        </div>
      )}

      {pins.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
          <div>
            <p className="text-lg font-semibold">New pins are coming soon.</p>
            <p className="mt-2 text-sm leading-6 text-white/58">
              Open the map to browse events as they are added.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function SessionCard({
  session,
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
    price: number
    currency: string
    fitnessLevel: string | null
    maxPeople: number | null
    user: { name: string | null } | null
    host: { name: string | null } | null
    community: { name: string | null; slug: string | null } | null
    _count: { userActivities: number }
  }
  priority?: boolean
  compact?: boolean
}) {
  const category = cleanText(session.categorySlug || 'fitness')
  const imageSrc =
    session.imageUrl || fallbackImages[category.toLowerCase()] || '/images/hero-bg.jpg'
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
      <div className={compact ? 'relative aspect-square self-start overflow-hidden bg-[#222222] sm:aspect-[4/3]' : 'relative aspect-[4/3] overflow-hidden bg-[#222222]'}>
        <Image
          src={imageSrc}
          alt={cleanText(session.title)}
          fill
          sizes={compact ? '(min-width: 640px) 45vw, 118px' : '(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw'}
          className="object-cover opacity-86 transition-transform duration-500 group-hover:scale-105"
          unoptimized={Boolean(session.imageUrl)}
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
        <div className={compact ? 'absolute left-3 top-3 rounded-md bg-black/52 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur sm:left-4 sm:top-4 sm:px-2.5 sm:text-xs' : 'absolute left-4 top-4 rounded-md bg-black/52 px-2.5 py-1 font-mono text-xs font-bold uppercase text-white/86 backdrop-blur'}>
          {activityLabel}
        </div>
        <div className={compact ? 'absolute right-3 top-3 rounded-md bg-[#63FF8F] px-2 py-1 font-mono text-[10px] font-bold uppercase text-black shadow-md sm:right-4 sm:top-4 sm:rounded-lg sm:px-2.5 sm:py-1.5 sm:text-xs' : 'absolute right-4 top-4 rounded-lg bg-[#63FF8F] px-2.5 py-1.5 font-mono text-xs font-bold uppercase text-black shadow-md'}>
          {priceLabel}
        </div>
        <div className={compact ? 'hidden rounded-md bg-black/48 px-2 py-1 font-mono text-[10px] font-bold uppercase text-white/86 backdrop-blur sm:absolute sm:bottom-4 sm:left-4 sm:block sm:px-2.5 sm:text-xs' : 'absolute bottom-4 left-4 rounded-md bg-black/48 px-2.5 py-1 font-mono text-xs font-bold uppercase text-white/86 backdrop-blur'}>
          {listingStatus}
        </div>
        <div className={compact ? 'hidden font-mono text-[10px] font-bold uppercase text-white drop-shadow-md sm:absolute sm:bottom-4 sm:right-4 sm:block sm:text-xs' : 'absolute bottom-4 right-4 font-mono text-xs font-bold uppercase text-white drop-shadow-md'}>
          View details
        </div>
      </div>
      <div className={compact ? 'grid min-w-0 content-between gap-1.5 p-3 text-xs font-bold text-white/58 sm:gap-2' : 'grid gap-2 p-3 text-xs font-bold text-white/58'}>
        <h3 className={compact ? 'line-clamp-2 text-sm font-semibold leading-tight text-white' : 'line-clamp-2 text-base font-semibold leading-tight text-white'}>
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

function hasCoordinates(session: { latitude: number | null; longitude: number | null }): boolean {
  return typeof session.latitude === 'number' && typeof session.longitude === 'number'
}

function cleanText(value: string): string {
  return value
    .replace(/\uFFFD+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
