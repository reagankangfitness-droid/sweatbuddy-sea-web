import Link from 'next/link'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Fitness Partners in Singapore',
  description: 'Stop working out alone. Find fitness buddies and join free P2P sessions near you in Singapore.',
}

const ACTIVITY_TYPES = [
  'running', 'gym', 'yoga', 'cycling', 'hiking', 'bootcamp', 'hiit', 'pilates', 'swimming',
]

const HOW_IT_WORKS = [
  {
    icon: '🔍',
    title: 'Browse sessions',
    body: 'Find upcoming workouts near you — running, gym, yoga, hiking, and more. All levels welcome.',
  },
  {
    icon: '🤝',
    title: 'Join or host',
    body: 'Join someone else\'s session or create your own in under 2 minutes. No experience required.',
  },
  {
    icon: '💪',
    title: 'Show up & connect',
    body: 'Meet real people, build accountability, and grow a fitness circle that keeps showing up.',
  },
]

const TESTIMONIALS = [
  {
    quote: 'I moved to Singapore 3 months ago with zero friends. SweatBuddies changed everything. I now have a regular run crew.',
    name: 'Sarah, 28',
  },
  {
    quote: 'Working out alone was killing my motivation. Now I look forward to every session because I know my buddies will be there.',
    name: 'Marcus, 35',
  },
  {
    quote: 'I hosted my first session nervous as hell. Six people showed up. We\'ve been meeting every week for two months.',
    name: 'Jamie, 31',
  },
]

export default async function HomePage() {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [sessionsThisWeek, totalMembers] = await Promise.all([
    prisma.activity.count({
      where: {
        status: 'PUBLISHED',
        deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        startTime: { gte: now, lte: nextWeek },
      },
    }),
    prisma.user.count({
      where: { p2pOnboardingCompleted: true },
    }),
  ])

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* ── Nav ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo size={28} />
          <nav className="flex items-center gap-2">
            <Link
              href="/browse"
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Browse
            </Link>
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Sign up free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 sm:py-36 px-4 sm:px-6">
        {/* Subtle gradient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[600px] w-[600px] rounded-full bg-white/[0.03] blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold tracking-widest text-neutral-500 uppercase mb-6">
            SweatBuddies · Singapore
          </p>

          <h1 className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Stop Working Out<br />
            <span className="text-neutral-400">Alone</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Find fitness partners in Singapore. Join free sessions, host your own, and build the workout crew
            you&apos;ve always wanted.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              Browse free sessions
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Create free account
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏃</span>
              <span><strong className="text-neutral-300">{sessionsThisWeek}</strong> session{sessionsThisWeek !== 1 ? 's' : ''} this week</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">👥</span>
              <span><strong className="text-neutral-300">{totalMembers}</strong> active member{totalMembers !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🇸🇬</span>
              <span><strong className="text-neutral-300">Singapore</strong> based</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-t border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">How it works</h2>
            <p className="text-neutral-400">Three steps to find your fitness tribe</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity types ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-t border-neutral-800/60">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Every type of workout</h2>
          <p className="text-neutral-400 mb-10">Whatever your vibe, find your people</p>

          <div className="flex flex-wrap justify-center gap-3">
            {ACTIVITY_TYPES.map((type) => (
              <Link key={type} href={`/browse?type=${type}`}>
                <ActivityBadge type={type} size="md" className="cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-t border-neutral-800/60 bg-neutral-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold">What people say</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <p className="text-neutral-300 leading-relaxed mb-5">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-sm font-semibold text-neutral-500">— {t.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 border-t border-neutral-800/60">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Your fitness tribe is waiting
          </h2>
          <p className="text-neutral-400 text-lg mb-10">
            Join SweatBuddies. It&apos;s free. Forever.
          </p>
          <Link
            href="/sign-up"
            className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
          >
            Create free account
          </Link>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-neutral-800 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <span>© 2026 SweatBuddies · Singapore</span>
          </div>
          <div className="flex gap-6">
            <Link href="/browse" className="hover:text-neutral-300 transition-colors">Browse</Link>
            <Link href="/sign-up" className="hover:text-neutral-300 transition-colors">Sign up</Link>
            <a href="mailto:support@sweatbuddies.sg" className="hover:text-neutral-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
