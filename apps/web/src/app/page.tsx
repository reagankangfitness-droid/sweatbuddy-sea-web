import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UsersRound,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { LandingIntentCapture } from '@/components/landing/LandingIntentCapture'
import { EVENTS } from '@/lib/analytics'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies - Fitness Communities in Bangkok and Singapore',
  description:
    'Discover local run clubs, yoga, pickleball, strength, and recovery sessions in Bangkok and Singapore.',
}

const activityFilters = [
  { label: 'Running', href: '/buddy?cat=running' },
  { label: 'Yoga', href: '/buddy?cat=yoga' },
  { label: 'Pickleball', href: '/buddy?cat=pickleball' },
  { label: 'Strength', href: '/buddy?cat=strength' },
  { label: 'Recovery', href: '/buddy?cat=recovery' },
  { label: 'Social', href: '/buddy?cat=social' },
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

export default async function HomePage() {
  const now = new Date()
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [communityCount, sessionsThisWeek, upcomingSessions] = await Promise.all([
    prisma.community.count({ where: { isActive: true } }),
    prisma.activity.count({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        startTime: { gte: now, lte: oneWeek },
      },
    }),
    prisma.activity.findMany({
      where: {
        status: 'PUBLISHED',
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
    }),
  ])

  const featuredSessions = upcomingSessions.slice(0, 6)
  const proofItems = [
    {
      value: sessionsThisWeek > 0 ? sessionsThisWeek.toString() : 'Live',
      label: 'sessions this week',
    },
    {
      value: communityCount > 0 ? communityCount.toString() : 'Growing',
      label: 'local communities',
    },
    { value: '2', label: 'cities' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F7F2] text-[#171717]">
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-[#F7F7F2]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="SweatBuddies home">
            <LogoWithText size={28} color="#111111" textColor="#111111" />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <TrackedLink
              href="/buddy"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_explore', destination: '/buddy' }}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold text-black/62 transition-colors hover:bg-black/[0.04] hover:text-black sm:inline-flex"
            >
              Explore
            </TrackedLink>
            <LandingIntentCapture
              type="HOST"
              sourcePlacement="nav_list_community"
              ctaLabel="List your community"
              successHref="/host"
              className="rounded-full bg-[#171717] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-black sm:px-5"
            >
              List your community
            </LandingIntentCapture>
          </nav>
        </div>
      </header>

      <main>
        <section className="px-5 pb-12 pt-8 sm:pb-16 sm:pt-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
              <div className="lg:sticky lg:top-28">
                <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-black/45">
                  Bangkok and Singapore
                </p>
                <h1 className="mt-4 max-w-2xl text-4xl font-extrabold leading-[0.98] tracking-tight text-[#111111] sm:text-6xl lg:text-7xl">
                  Find fitness sessions near you.
                </h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-black/62 sm:text-lg">
                  Run clubs, yoga, pickleball, strength, and recovery sessions you can join this
                  week.
                </p>

                <div className="mt-7 overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                  <div className="grid divide-y divide-black/10 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
                    <SearchField label="Where" value="Bangkok or Singapore" href="/buddy" />
                    <SearchField label="Activity" value="Run, yoga, pickleball" href="/buddy" />
                    <SearchField label="When" value="This week" href="/buddy" />
                    <TrackedLink
                      href="/buddy"
                      event={EVENTS.LANDING_CTA_CLICKED}
                      metadata={{ placement: 'hero_search_button', destination: '/buddy' }}
                      className="flex items-center justify-center gap-2 bg-[#B7F000] px-5 py-4 text-sm font-extrabold text-[#111111] transition-colors hover:bg-[#A6DE00]"
                    >
                      <Search size={18} strokeWidth={2.4} />
                      Search
                    </TrackedLink>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <CityPill href="/singapore" label="Singapore" />
                  <CityPill href="/bangkok" label="Bangkok" />
                  <CityPill href="/buddy?solo=true" label="Come solo" />
                </div>

                <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-black/10 border-y border-black/10">
                  {proofItems.map((item) => (
                    <div key={item.label} className="px-4 py-4 first:pl-0">
                      <p className="text-2xl font-extrabold tracking-tight text-[#111111] sm:text-3xl">
                        {item.value}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-black/45">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-black/42">
                      Happening soon
                    </p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-tight text-[#111111] sm:text-2xl">
                      Join something this week
                    </h2>
                  </div>
                  <TrackedLink
                    href="/buddy"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'hero_listing_view_all', destination: '/buddy' }}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-black/58 transition-colors hover:text-black"
                  >
                    View all
                    <ArrowRight size={16} />
                  </TrackedLink>
                </div>

                {featuredSessions.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {featuredSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-black/10 bg-white p-8 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                    <h2 className="text-2xl font-extrabold tracking-tight">
                      New sessions are being added.
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-6 text-black/58">
                      Browse crews now or list your own community to be part of the next drop.
                    </p>
                    <TrackedLink
                      href="/buddy"
                      event={EVENTS.LANDING_CTA_CLICKED}
                      metadata={{ placement: 'hero_empty_explore', destination: '/buddy' }}
                      className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#171717] px-5 py-3 text-sm font-bold text-white"
                    >
                      Explore sessions <ArrowRight size={16} />
                    </TrackedLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/[0.08] bg-white px-5 py-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-black/42">
                Browse by activity
              </p>
              <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#111111]">
                Start with the kind of session you want.
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {activityFilters.map((filter) => (
                <TrackedLink
                  key={filter.label}
                  href={filter.href}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{
                    placement: 'activity_filter',
                    destination: filter.href,
                    activity: filter.label,
                  }}
                  className="rounded-full border border-black/10 bg-[#F7F7F2] px-4 py-2 text-sm font-bold text-black/68 transition-colors hover:border-black/25 hover:text-black"
                >
                  {filter.label}
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">
            {[
              {
                icon: TicketCheck,
                title: 'Know what you are joining',
                body: 'See the host, time, location, price, and group context before you show up.',
              },
              {
                icon: UsersRound,
                title: 'Come solo without guessing',
                body: 'Find sessions where meeting new people is normal, not an awkward side quest.',
              },
              {
                icon: ShieldCheck,
                title: 'Return to familiar faces',
                body: 'Recurring communities make consistency easier than starting from zero every week.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-[24px] border border-black/10 bg-white p-6 shadow-[0_16px_50px_rgba(0,0,0,0.06)]"
                >
                  <Icon size={24} strokeWidth={2.2} className="text-black/76" />
                  <h3 className="mt-5 text-lg font-extrabold tracking-tight text-[#111111]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-black/58">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="px-5 pb-14 sm:pb-20">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] bg-[#171717] text-white lg:grid-cols-[1.04fr_0.96fr]">
            <div className="relative min-h-[320px]">
              <Image
                src="/images/hosts/run-club-group.jpg"
                alt="A local run club gathered after a session"
                fill
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur">
                  <Sparkles size={14} />
                  For hosts
                </p>
              </div>
            </div>
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/42">
                List your community
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Fill sessions without sending people through messy chats.
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-white/62 sm:text-base">
                Give newcomers a clear page to discover your crew, book a spot, and come back next
                week.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {['Recurring events', 'Paid spots', 'First-timer discovery'].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm font-bold text-white/82"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <LandingIntentCapture
                type="HOST"
                sourcePlacement="host_section_list_community"
                ctaLabel="List your community"
                successHref="/host"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#B7F000] px-6 py-3.5 text-sm font-extrabold text-[#111111] transition-colors hover:bg-[#A6DE00]"
              >
                List your community <ArrowRight size={17} />
              </LandingIntentCapture>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/[0.08] px-5 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#111111" textColor="#555555" />
            <span className="text-xs text-black/45">&copy; 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs font-semibold text-black/48">
            <Link href="/buddy" className="transition-colors hover:text-black">
              Explore
            </Link>
            <Link href="/singapore" className="transition-colors hover:text-black">
              Singapore
            </Link>
            <Link href="/bangkok" className="transition-colors hover:text-black">
              Bangkok
            </Link>
            <Link href="/host" className="transition-colors hover:text-black">
              For hosts
            </Link>
            <Link href="/support" className="transition-colors hover:text-black">
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function SearchField({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <TrackedLink
      href={href}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement: `hero_search_${label.toLowerCase()}`, destination: href }}
      className="block px-5 py-4 text-left transition-colors hover:bg-black/[0.03]"
    >
      <span className="block text-[11px] font-extrabold uppercase tracking-wide text-black/45">
        {label}
      </span>
      <span className="mt-1 block truncate text-sm font-bold text-[#111111]">{value}</span>
    </TrackedLink>
  )
}

function CityPill({ href, label }: { href: string; label: string }) {
  return (
    <TrackedLink
      href={href}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{ placement: 'hero_quick_filter', destination: href, label }}
      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-black/62 transition-colors hover:border-black/25 hover:text-black"
    >
      {label}
    </TrackedLink>
  )
}

function SessionCard({
  session,
}: {
  session: {
    id: string
    title: string
    startTime: Date | null
    city: string
    address: string | null
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
}) {
  const category = cleanText(session.categorySlug || 'fitness')
  const imageSrc =
    session.imageUrl || fallbackImages[category.toLowerCase()] || '/images/hero-bg.jpg'
  const location = cleanText(session.address?.split(',')[0] || session.city)
  const hostName = cleanText(
    session.community?.name || session.host?.name || session.user?.name || 'Local host',
  )
  const going = session._count.userActivities

  return (
    <TrackedLink
      href={`/activities/${session.id}`}
      event={EVENTS.LANDING_CTA_CLICKED}
      metadata={{
        placement: 'homepage_listing_card',
        destination: `/activities/${session.id}`,
        sessionId: session.id,
      }}
      className="group overflow-hidden rounded-[24px] border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(0,0,0,0.12)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-black/5">
        <Image
          src={imageSrc}
          alt={cleanText(session.title)}
          fill
          sizes="(min-width: 1280px) 260px, (min-width: 640px) 45vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized={Boolean(session.imageUrl)}
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-extrabold capitalize text-[#111111] shadow-sm backdrop-blur">
          {formatCategory(category)}
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-[#171717]/90 px-3 py-1 text-xs font-extrabold text-white backdrop-blur">
          {formatPrice(session.price, session.currency)}
        </div>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-base font-extrabold leading-tight tracking-tight text-[#111111]">
          {cleanText(session.title)}
        </h3>
        <p className="mt-2 truncate text-sm font-semibold text-black/50">by {hostName}</p>
        <div className="mt-4 space-y-2 text-sm text-black/58">
          <p className="flex items-center gap-2 truncate">
            <CalendarDays size={15} strokeWidth={2.2} className="shrink-0 text-black/42" />
            <span className="truncate">{formatSessionTime(session.startTime, session.city)}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <MapPin size={15} strokeWidth={2.2} className="shrink-0 text-black/42" />
            <span className="truncate">{location}</span>
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-black/10 pt-3 text-xs font-bold text-black/46">
          <span>{going > 0 ? `${going} going` : 'New session'}</span>
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
