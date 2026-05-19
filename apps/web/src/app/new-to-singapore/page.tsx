import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import {
  ArrowRight,
  CalendarCheck,
  MapPin,
  MessageCircle,
  Moon,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { LogoWithText } from '@/components/logo'
import { TrackedLink } from '@/components/TrackedLink'
import { EVENTS } from '@/lib/analytics'

export const metadata: Metadata = {
  title: 'New to Singapore? Find Your First Fitness Crew | SweatBuddies',
  description:
    'New to Singapore? Find beginner-friendly run clubs, yoga groups, pickleball crews, and local fitness sessions where showing up alone is normal.',
  openGraph: {
    title: 'New to Singapore? Find Your First Fitness Crew | SweatBuddies',
    description:
      'Find local fitness sessions where newcomers are expected, hosts are clear, and meeting people starts with movement.',
  },
}

const pains = [
  {
    icon: Search,
    title: 'Stop guessing where people meet',
    body: 'Find run clubs, yoga groups, pickleball crews, bootcamps, and recovery sessions without hunting through stories, chats, or word of mouth.',
  },
  {
    icon: ShieldCheck,
    title: 'Show up without the awkward cold start',
    body: 'See the host, activity, time, location, and group context before you arrive, so coming alone feels normal.',
  },
  {
    icon: CalendarCheck,
    title: 'Build a weekly rhythm',
    body: 'One session gives you a plan. Repeating sessions give you people you can recognize again next week.',
  },
]

const routes = [
  { label: 'Run clubs', image: '/banner/running.jpg' },
  { label: 'Yoga groups', image: '/images/hero-bg.jpg' },
  { label: 'Pickleball crews', image: '/images/community-bonds.jpg' },
]

const moments = [
  'You just moved here and do not know where to start.',
  'Your social life is stuck between work, dating apps, and nightlife.',
  'You want healthier plans where conversation has something to orbit around.',
  'You are ready to meet people, but you do not want forced networking.',
]

export default function NewToSingaporePage() {
  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#080808]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" aria-label="SweatBuddies home">
            <LogoWithText size={28} color="#FFFFFF" textColor="#FFFFFF" />
          </Link>
          <nav className="flex items-center gap-3">
            <TrackedLink
              href="/buddy"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'newcomer_nav_browse', destination: '/buddy', experiment: 'newcomer_wedge' }}
              className="hidden text-sm font-medium text-white/65 transition-colors hover:text-white sm:inline"
            >
              Browse sessions
            </TrackedLink>
            <TrackedLink
              href="/host"
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{ placement: 'newcomer_nav_host', destination: '/host', experiment: 'newcomer_wedge' }}
              className="rounded-full bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-black transition-colors hover:bg-neutral-200 sm:text-sm"
            >
              Host a crew
            </TrackedLink>
          </nav>
        </div>
      </header>

      <main className="overflow-x-hidden">
        <section className="relative min-h-[calc(100svh-78px)] overflow-hidden px-5 py-12 sm:min-h-[700px] sm:py-16">
          <Image
            src="/images/community-bonds.jpg"
            alt="People meeting through a local fitness crew in Singapore"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,8,8,0.94)_0%,rgba(8,8,8,0.76)_44%,rgba(8,8,8,0.20)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-[#080808] to-transparent" />

          <div className="relative mx-auto flex min-h-[calc(100svh-174px)] max-w-6xl items-end sm:min-h-[590px]">
            <div className="max-w-3xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-white/68">
                For newcomers in Singapore
              </p>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[0.98] tracking-tight text-white sm:text-7xl">
                New to Singapore? Find your first fitness crew.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/78 sm:text-lg">
                Meet people without forcing small talk. Join beginner-friendly run clubs, yoga groups, pickleball crews, and local sessions where showing up alone is normal.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <TrackedLink
                  href="/buddy"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'newcomer_hero_browse', destination: '/buddy', experiment: 'newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-neutral-200"
                >
                  Find sessions near me <ArrowRight size={17} strokeWidth={2.4} />
                </TrackedLink>
                <TrackedLink
                  href="/host"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'newcomer_hero_host', destination: '/host', experiment: 'newcomer_wedge' }}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/10"
                >
                  List your crew
                </TrackedLink>
              </div>
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-3">
            {pains.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5">
                  <Icon size={22} strokeWidth={2.2} className="text-white/82" />
                  <h2 className="mt-5 text-base font-bold">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/55">{item.body}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-y border-white/[0.06] bg-[#0D0D0D] px-5 py-14 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Why this works</p>
              <h2 className="mt-3 max-w-lg text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                Fitness gives the first conversation a reason to exist.
              </h2>
              <p className="mt-5 max-w-md text-base leading-8 text-white/58">
                You do not need to walk into a room and pitch yourself. You show up for the same movement, follow the same plan, and let familiarity build session by session.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {moments.map((moment) => (
                <div key={moment} className="rounded-lg border border-white/[0.08] bg-white/[0.035] p-5">
                  <p className="text-sm leading-6 text-white/68">{moment}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-14 sm:py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/45">Start with one plan</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                  Choose a familiar way to meet unfamiliar people.
                </h2>
              </div>
              <TrackedLink
                href="/buddy"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'newcomer_routes_browse_all', destination: '/buddy', experiment: 'newcomer_wedge' }}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white"
              >
                See all sessions <ArrowRight size={16} />
              </TrackedLink>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {routes.map((route, index) => (
                <TrackedLink
                  key={route.label}
                  href="/buddy"
                  event={EVENTS.LANDING_CTA_CLICKED}
                  metadata={{ placement: 'newcomer_route_card', destination: '/buddy', label: route.label, position: index + 1, experiment: 'newcomer_wedge' }}
                  className="group relative min-h-[330px] overflow-hidden rounded-lg bg-[#171717]"
                >
                  <Image
                    src={route.image}
                    alt={route.label}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/58">Beginner-friendly</p>
                    <h3 className="mt-2 text-2xl font-extrabold text-white">{route.label}</h3>
                  </div>
                </TrackedLink>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-[#F3F0E8] px-5 py-14 text-[#101010] sm:p-12 lg:p-16">
            <div className="mx-auto max-w-xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-600">For hosts</p>
              <h2 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Be the crew newcomers find first.
              </h2>
              <p className="mt-5 text-base leading-8 text-black/65">
                People arriving in Singapore are actively looking for routine, trust, and friendly entry points. Make your session visible before they know anyone.
              </p>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: MapPin, label: 'Get found nearby' },
                  { icon: MessageCircle, label: 'Move admin out of DMs' },
                  { icon: UsersRound, label: 'Turn first-timers into regulars' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="rounded-lg border border-black/10 bg-white p-4">
                      <Icon size={19} strokeWidth={2.2} />
                      <p className="mt-4 text-xs font-extrabold leading-5">{item.label}</p>
                    </div>
                  )
                })}
              </div>
              <TrackedLink
                href="/host"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'newcomer_host_section', destination: '/host', experiment: 'newcomer_wedge' }}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#101010] px-7 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-black"
              >
                Start hosting <ArrowRight size={17} />
              </TrackedLink>
            </div>
          </div>

          <div className="relative min-h-[480px] overflow-hidden">
            <Image
              src="/images/organizers-bg.jpg"
              alt="A local fitness community welcoming new people"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/65">Not nightlife. Not networking.</p>
              <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
                A lower-pressure way to make the city feel familiar.
              </h2>
            </div>
          </div>
        </section>

        <section className="border-t border-white/[0.06] px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Moon className="mx-auto text-white/45" size={24} />
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.22em] text-white/45">Start this week</p>
            <h2 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Stop waiting for the city to feel smaller.
            </h2>
            <p className="mt-5 text-base leading-8 text-white/58">
              Pick one session. Show up once. Give yourself a real chance to see the same people again.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <TrackedLink
                href="/buddy"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'newcomer_final_browse', destination: '/buddy', experiment: 'newcomer_wedge' }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold uppercase tracking-wide text-black transition-colors hover:bg-neutral-200"
              >
                Find a session <ArrowRight size={17} />
              </TrackedLink>
              <TrackedLink
                href="/"
                event={EVENTS.LANDING_CTA_CLICKED}
                metadata={{ placement: 'newcomer_final_home', destination: '/', experiment: 'newcomer_wedge' }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-8 py-4 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white/[0.06]"
              >
                Back to SweatBuddies
              </TrackedLink>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
