import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import {
  ArrowRight,
  CalendarDays,
  CreditCard,
  MapPin,
  Megaphone,
  Repeat2,
  Search,
  TicketCheck,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { EVENTS } from '@/lib/analytics'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Your First Fitness Crew in Singapore or Bangkok',
  description:
    'New to Singapore or Bangkok? Find run clubs, yoga groups, pickleball crews, and local fitness sessions where showing up alone is normal.',
}

export default async function HomePage() {
  const now = new Date()
  const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [communityCount, sessionsThisWeek, upcomingSessions, cities] = await Promise.all([
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
        _count: { select: { userActivities: { where: { status: { in: ['JOINED', 'COMPLETED'] } } } } },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    }),
    prisma.city.findMany({
      where: { isLaunched: true, communityCount: { gt: 0 } },
      select: { name: true, communityCount: true },
      orderBy: { communityCount: 'desc' },
    }),
  ])

  const curatedPhotos = [
    { src: '/images/community-bonds.jpg', label: 'Pickleball crews', href: '/buddy' },
    { src: '/images/cities/bangkok.jpg', label: 'Bangkok social fitness', href: '/bangkok' },
    { src: '/images/cities/singapore.jpg', label: 'Singapore newcomer crews', href: '/singapore' },
    { src: '/banner/running.jpg', label: 'Post-run circles', href: '/buddy' },
    { src: '/images/connect-people.webp', label: 'Outdoor strength', href: '/buddy' },
    { src: '/images/hero-bg.jpg', label: 'Park yoga', href: '/buddy' },
    { src: '/images/hero-1.webp', label: 'City run clubs', href: '/buddy' },
    { src: '/banner/athletics.jpg', label: 'Beach bootcamps', href: '/buddy' },
  ]

  const fallbackPhotos = [
    { src: '/banner/running.jpg', label: 'Run crews', href: '/buddy' },
    { src: '/images/hero-bg.jpg', label: 'Park yoga', href: '/buddy' },
    { src: '/banner/athletics.jpg', label: 'Strength clubs', href: '/buddy' },
    { src: '/banner/run-club.jpg', label: 'Post-session people', href: '/buddy' },
    { src: '/banner/ice-bath.webp', label: 'Recovery circles', href: '/buddy' },
  ]

  const photos = uniquePhotos(curatedPhotos).slice(0, 8)
  const railPhotos = photos.length >= 3 ? photos : fallbackPhotos

  function formatSessionTime(date: Date): string {
    const TZ = 'Asia/Singapore'
    const diff = date.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ })
    const todaySG = now.toLocaleDateString('en-CA', { timeZone: TZ })
    const dateSG = date.toLocaleDateString('en-CA', { timeZone: TZ })
    const tomorrowDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const tomorrowSG = tomorrowDate.toLocaleDateString('en-CA', { timeZone: TZ })
    if (hours < 2 && hours > 0) return `In ${Math.round(hours * 60)} min`
    if (dateSG === todaySG) return `Today ${time}`
    if (dateSG === tomorrowSG) return `Tomorrow ${time}`
    return date.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ }) + ` ${time}`
  }

  const proofItems = [
    { value: communityCount > 0 ? `${communityCount}` : 'Live', label: 'local crews' },
    { value: sessionsThisWeek > 0 ? `${sessionsThisWeek}` : 'New', label: 'sessions this week' },
    { value: cities.length > 0 ? `${cities.length}` : 'SEA', label: 'cities growing' },
  ]

  const memberSteps = [
    {
      icon: Search,
      title: 'Stop starting from zero',
      body: 'Find beginner-friendly run clubs, yoga groups, pickleball crews, bootcamps, and recovery sessions that already welcome new people.',
    },
    {
      icon: TicketCheck,
      title: 'Arrive with context',
      body: 'See the host, timing, location, price, and who else is going before you walk in.',
    },
    {
      icon: Repeat2,
      title: 'Build repeat familiarity',
      body: 'Go once, recognize people the next time, and let consistency turn strangers into regulars.',
    },
  ]

  const hostBenefits = [
    { icon: Megaphone, title: 'Reach first-timers', body: 'Get discovered by newcomers and long-stay visitors looking for a group to join this week.' },
    { icon: CreditCard, title: 'Move past messy chats', body: 'Run free sessions or collect paid spots without chasing RSVPs across DMs.' },
    { icon: UserRoundCheck, title: 'Build repeat members', body: 'Track capacity, attendees, and returning faces before people arrive.' },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#FAFAFA]">
      <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <LogoWithText size={28} color="#FFFFFF" textColor="#FFFFFF" />
          <nav className="flex items-center gap-3">
            <TrackedLink
              href="/buddy"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_find_crew', destination: '/buddy' }}
              className="hidden sm:inline text-sm font-medium text-white/65 hover:text-white transition-colors"
            >
              Find a crew
            </TrackedLink>
            <TrackedLink
              href="/host"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'nav_start_hosting', destination: '/host' }}
              className="px-4 py-2.5 bg-white text-black text-xs sm:text-sm font-bold uppercase tracking-wide rounded-full hover:bg-neutral-200 transition-colors"
            >
              Start hosting
            </TrackedLink>
          </nav>
        </div>
      </header>

      <main className="overflow-x-hidden">
        <section className="relative min-h-[calc(100svh-132px)] sm:min-h-[640px] px-5 py-10 sm:py-16 flex items-end overflow-hidden">
          <Image
            src="/images/hero-bg.jpg"
            alt="A local outdoor fitness community moving together"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.92)_0%,rgba(8,8,8,0.70)_42%,rgba(8,8,8,0.18)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#080808] to-transparent" />

          <div className="relative max-w-6xl mx-auto w-full">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/70">
                Social fitness for new-city life
              </p>
              <h1 className="text-5xl sm:text-7xl font-extrabold leading-[0.98] tracking-tight text-white max-w-3xl">
                New to Singapore or Bangkok? Find your first fitness crew.
              </h1>
              <p className="mt-6 max-w-xl text-base sm:text-lg leading-8 text-white/78">
                Moving cities should not mean rebuilding your social life from zero. Join beginner-friendly run clubs, yoga groups, pickleball crews, bootcamps, and recovery sessions where showing up alone is normal.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <TrackedLink
                  href="/singapore"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'hero_singapore', destination: '/singapore', experiment: 'two_city_newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 bg-white text-black text-sm font-bold uppercase tracking-wide rounded-full hover:bg-neutral-200 transition-colors"
                >
                  Explore Singapore <ArrowRight size={17} strokeWidth={2.4} />
                </TrackedLink>
                <TrackedLink
                  href="/bangkok"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'hero_bangkok', destination: '/bangkok', experiment: 'two_city_newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 border border-white/25 text-white text-sm font-bold uppercase tracking-wide rounded-full hover:bg-white/10 transition-colors"
                >
                  Explore Bangkok
                </TrackedLink>
              </div>
            </div>

            <div className="mt-10 grid grid-cols-3 max-w-xl border-y border-white/15 bg-black/20 backdrop-blur-sm">
              {proofItems.map((item) => (
                <div key={item.label} className="px-4 py-4 border-r border-white/10 last:border-r-0">
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight">{item.value}</p>
                  <p className="mt-1 text-[11px] sm:text-xs uppercase tracking-wide text-white/58">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-20 border-y border-white/[0.06] bg-[#F3F0E8] text-[#101010]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.95fr_1.05fr] gap-8 lg:gap-14 items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-600">Two-city newcomer path</p>
              <h2 className="mt-3 max-w-2xl text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Find your people in the city before it starts feeling lonely.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-black/62">
                Singapore and Bangkok both have active communities. The hard part is knowing which run, game, class, or recovery session is actually friendly to first-timers.
              </p>
              <div className="mt-7 flex flex-col sm:flex-row gap-3">
                <TrackedLink
                  href="/singapore"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'homepage_city_section_singapore', destination: '/singapore', experiment: 'two_city_newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#101010] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-black transition-colors"
                >
                  Singapore <ArrowRight size={17} />
                </TrackedLink>
                <TrackedLink
                  href="/bangkok"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'homepage_city_section_bangkok', destination: '/bangkok', experiment: 'two_city_newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-7 py-4 text-sm font-bold uppercase tracking-wide text-[#101010] hover:bg-black/[0.04] transition-colors"
                >
                  Bangkok
                </TrackedLink>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { title: 'New-city entry', body: 'For people who just landed, relocated, or feel socially stuck in the city they live in.' },
                { title: 'Movement first', body: 'Meet through runs, games, yoga, strength sessions, and recovery plans instead of forced networking.' },
                { title: 'Regulars matter', body: 'The goal is not one event. It is finding a crew you can return to next week.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.08)]">
                  <h3 className="text-sm font-extrabold text-[#101010]">{item.title}</h3>
                  <p className="mt-3 text-xs leading-5 text-black/58">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Real crews nearby</p>
                <h2 className="mt-2 text-2xl sm:text-4xl font-bold tracking-tight">Communities you can actually join.</h2>
              </div>
              <TrackedLink
                href="/communities"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'community_rail_browse', destination: '/communities' }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
              >
                Browse crews <ArrowRight size={16} />
              </TrackedLink>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
              {railPhotos.map((p, i) => (
                <TrackedLink
                  key={`${p.href}-${i}`}
                  href={p.href}
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'community_rail_card', destination: p.href, label: p.label, position: i + 1 }}
                  className="group relative flex-shrink-0 w-52 h-72 sm:w-64 sm:h-80 overflow-hidden rounded-lg bg-[#171717]"
                >
                  <Image
                    src={p.src}
                    alt={p.label}
                    fill
                    sizes="(min-width: 640px) 256px, 208px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <p className="absolute bottom-4 left-4 right-4 text-sm font-bold text-white truncate">{p.label}</p>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-20 border-y border-white/[0.06] bg-[#0D0D0D]">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-[0.8fr_1.2fr] gap-10 lg:gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">For members</p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                Stop walking into fitness spaces cold.
              </h2>
              <p className="mt-5 text-base leading-8 text-white/62 max-w-md">
                Choose a session where the activity, host, time, and group are clear before you arrive, so meeting people starts with something to do.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {memberSteps.map((step) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5">
                    <Icon className="text-white/82" size={22} strokeWidth={2.2} />
                    <h3 className="mt-5 text-base font-bold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{step.body}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative min-h-[460px] overflow-hidden">
            <Image
              src="/images/organizers-bg.jpg"
              alt="A fitness community smiling together after a session"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/65">Member promise</p>
              <h2 className="mt-3 max-w-md text-3xl sm:text-5xl font-bold tracking-tight leading-tight">
                No more showing up wondering where you fit.
              </h2>
            </div>
          </div>

          <div className="bg-[#F3F0E8] text-[#101010] px-5 py-14 sm:p-12 lg:p-16 flex items-center">
            <div className="w-full max-w-xl mx-auto">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-600">For hosts</p>
              <h2 className="mt-3 text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-[#101010]">
                Bring first-timers in before they know who to ask.
              </h2>
              <p className="mt-5 text-base leading-8 text-black/65">
                Newcomers and long-stay visitors are actively looking for friendly crews in Singapore and Bangkok. Give them a clear session page instead of another buried story, LINE thread, or WhatsApp invite.
              </p>

              <div className="mt-8 overflow-hidden rounded-lg border border-black/10 bg-black">
                <div className="relative h-56 sm:h-64">
                  <Image
                    src="/images/hosts/run-club-group.jpg"
                    alt="A local fitness crew smiling together after a session"
                    fill
                    sizes="(min-width: 1024px) 42vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/65">Host proof</p>
                    <p className="mt-1 max-w-sm text-xl font-extrabold leading-tight text-white">
                      Real crews. Clear sessions. First-timers who know how to show up.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-lg border border-black/10 bg-white shadow-[0_18px_60px_rgba(0,0,0,0.16)] overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/10 px-5 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-black/45">Host hub</p>
                    <p className="text-lg font-extrabold">Saturday crew session</p>
                  </div>
                  <span className="rounded-full bg-[#101010] px-3 py-1 text-xs font-bold text-white">12 going</span>
                </div>
                <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/10">
                  {hostBenefits.map((benefit) => {
                    const Icon = benefit.icon
                    return (
                      <div key={benefit.title} className="p-5">
                        <Icon size={21} strokeWidth={2.2} />
                        <h3 className="mt-4 text-sm font-extrabold">{benefit.title}</h3>
                        <p className="mt-2 text-xs leading-5 text-black/58">{benefit.body}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <TrackedLink
                href="/host"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'host_section_start_hosting', destination: '/host' }}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#101010] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-black transition-colors"
              >
                Start hosting <ArrowRight size={17} />
              </TrackedLink>
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Where it is growing</p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight">Two launch cities. One sharper pain.</h2>
              <p className="mt-4 text-sm leading-7 text-white/55 max-w-lg">
                Start with newcomers in Singapore and Bangkok, then expand around the same behavior: people using movement as the easiest way to enter a city socially.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {[
                  { name: 'Singapore', href: '/singapore', count: 'Premium, trust-first crews' },
                  { name: 'Bangkok', href: '/bangkok', count: 'Energetic, fragmented discovery' },
                ].map((c) => (
                  <TrackedLink
                    key={c.name}
                    href={c.href}
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'launch_city_pill', destination: c.href, city: c.name, experiment: 'two_city_newcomer_wedge' }}
                    className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm text-white/68 hover:border-white/20 hover:text-white transition-colors"
                  >
                    <span className="font-bold text-white">{c.name}</span> {c.count}
                  </TrackedLink>
                ))}
              </div>
              {cities.length > 0 && (
                <div className="mt-7 flex flex-wrap gap-2">
                  {cities.map((c) => (
                    <TrackedLink
                      key={c.name}
                      href="/buddy"
                      event={EVENTS.LANDING_CTA_CLICKED}
                      metadata={{ placement: 'city_pill', destination: '/buddy', city: c.name, communityCount: c.communityCount }}
                      className="rounded-full border border-white/[0.08] bg-white/[0.035] px-4 py-2 text-sm text-white/68 hover:border-white/20 hover:text-white transition-colors"
                    >
                      {c.name} <span className="font-bold text-white">{c.communityCount}</span>
                    </TrackedLink>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Happening soon</p>
                  <h3 className="mt-1 text-xl font-bold">Join something this week</h3>
                </div>
                <CalendarDays className="text-white/55" size={22} />
              </div>
              <div className="divide-y divide-white/[0.07]">
                {upcomingSessions.length > 0 ? (
                  upcomingSessions.map((s) => {
                    const going = s._count.userActivities
                    const location = s.address ? s.address.split(',')[0] : s.city
                    return (
                      <TrackedLink
                        key={s.id}
                        href={`/activities/${s.id}`}
                        event={EVENTS.LANDING_CTA_CLICKED}
                        metadata={{ placement: 'happening_soon_session', destination: `/activities/${s.id}`, sessionId: s.id }}
                        className="group flex items-center gap-4 py-4"
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-black">
                          <UsersRound size={18} strokeWidth={2.4} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-bold group-hover:text-white">{cleanText(s.title)}</span>
                          <span className="mt-1 flex items-center gap-1 truncate text-xs text-white/45">
                            {s.startTime ? formatSessionTime(s.startTime) : 'Time TBA'}
                            {location && (
                              <>
                                <span>·</span>
                                <MapPin size={12} />
                                <span className="truncate">{cleanText(location)}</span>
                              </>
                            )}
                          </span>
                        </span>
                        <span className="flex-shrink-0 text-xs font-semibold text-white/45">
                          {going > 0 ? `${going} going` : 'New'}
                        </span>
                      </TrackedLink>
                    )
                  })
                ) : (
                  <TrackedLink
                    href="/buddy"
                    event={EVENTS.LANDING_CTA_CLICKED}
                    metadata={{ placement: 'happening_soon_empty', destination: '/buddy' }}
                    className="flex items-center justify-between gap-4 py-5 text-sm text-white/65 hover:text-white"
                  >
                    Explore local crews
                    <ArrowRight size={16} />
                  </TrackedLink>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-16 sm:py-24 border-t border-white/[0.06]">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Start with one session</p>
            <h2 className="mt-3 text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
              Stop waiting for friends to make the plan.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              Choose Singapore or Bangkok, pick one local session, and give yourself a lower-pressure way to meet people this week.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <TrackedLink
                href="/singapore"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'final_singapore', destination: '/singapore', experiment: 'two_city_newcomer_wedge' }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-black hover:bg-neutral-200 transition-colors"
              >
                Singapore <ArrowRight size={17} />
              </TrackedLink>
              <TrackedLink
                href="/bangkok"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'final_bangkok', destination: '/bangkok', experiment: 'two_city_newcomer_wedge' }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white hover:bg-white/[0.06] transition-colors"
              >
                Bangkok
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-10 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#FFFFFF" textColor="#666666" />
            <span className="text-xs text-[#666666]">&copy; 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-xs text-[#777777]">
            <Link href="/buddy" className="hover:text-[#FAFAFA] transition-colors">Find a crew</Link>
            <Link href="/singapore" className="hover:text-[#FAFAFA] transition-colors">Singapore</Link>
            <Link href="/bangkok" className="hover:text-[#FAFAFA] transition-colors">Bangkok</Link>
            <Link href="/communities" className="hover:text-[#FAFAFA] transition-colors">Crews</Link>
            <Link href="/hub" className="hover:text-[#FAFAFA] transition-colors">Host Hub</Link>
            <Link href="/support" className="hover:text-[#FAFAFA] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function cleanText(value: string): string {
  return value.replace(/\uFFFD+/g, ' ').replace(/\s+/g, ' ').trim()
}

function uniquePhotos<T extends { src: string }>(photos: T[]): T[] {
  const seen = new Set<string>()
  return photos.filter((photo) => {
    if (seen.has(photo.src)) return false
    seen.add(photo.src)
    return true
  })
}
