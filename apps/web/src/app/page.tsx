import Link from 'next/link'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { prisma } from '@/lib/prisma'
import { format, isToday, isTomorrow, formatDistanceToNow } from 'date-fns'

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Fitness Partners in Singapore',
  description: 'Stop working out alone. Find fitness buddies and join free P2P sessions near you in Singapore.',
}

const ACTIVITY_TYPES = [
  'running', 'gym', 'yoga', 'cycling', 'hiking', 'bootcamp', 'hiit', 'pilates', 'swimming',
]

const ACTIVITY_EMOJIS: Record<string, string> = {
  running: '🏃', cycling: '🚴', yoga: '🧘', strength: '🏋️', gym: '🏋️',
  hiking: '🥾', bootcamp: '🎖️', hiit: '⚡', pilates: '🦢',
  swimming: '🏊', volleyball: '🏐', basketball: '🏀', cold_plunge: '🧊', other: '🏅',
}

function formatSessionTime(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
  return format(date, 'EEE, MMM d · h:mm a')
}

export default async function HomePage() {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [sessionsThisWeek, totalMembers, newMembersThisWeek, upcomingSessions, recentJoins] =
    await Promise.all([
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
      prisma.user.count({
        where: {
          p2pOnboardingCompleted: true,
          createdAt: { gte: sevenDaysAgo },
        },
      }),
      prisma.activity.findMany({
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          startTime: { gte: now },
        },
        orderBy: { startTime: 'asc' },
        take: 3,
        include: {
          user: { select: { name: true, imageUrl: true } },
          userActivities: {
            where: { status: { in: ['JOINED', 'COMPLETED'] } },
            select: { id: true },
          },
        },
      }),
      // Recent joins for the activity ticker
      prisma.userActivity.findMany({
        where: {
          status: { in: ['JOINED', 'COMPLETED'] },
          createdAt: { gte: sevenDaysAgo },
          activity: {
            deletedAt: null,
            activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          user: { select: { name: true } },
          activity: { select: { title: true, categorySlug: true } },
        },
      }),
    ])

  // Build hero stat line
  const heroLine =
    sessionsThisWeek > 0
      ? `${sessionsThisWeek} session${sessionsThisWeek !== 1 ? 's' : ''} happening in Singapore this week`
      : totalMembers > 0
      ? `${totalMembers} people already working out together in Singapore`
      : 'Free workout sessions in Singapore. No fees. No commitment.'

  // Build ticker items from real data
  const tickerItems: string[] = recentJoins
    .filter((j) => j.user.name)
    .map((j) => {
      const firstName = j.user.name!.split(' ')[0]
      const emoji = ACTIVITY_EMOJIS[j.activity.categorySlug ?? 'other'] ?? '🏅'
      return `${firstName} joined ${emoji} ${j.activity.title}`
    })

  // Pad with context items if needed
  if (tickerItems.length < 4) {
    if (sessionsThisWeek > 0) tickerItems.push(`${sessionsThisWeek} sessions this week in Singapore`)
    if (newMembersThisWeek > 0) tickerItems.push(`${newMembersThisWeek} new members joined this week`)
    tickerItems.push('All sessions are free to join')
    tickerItems.push('No experience needed — first-timers welcome')
  }

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
              {sessionsThisWeek > 0 ? `${sessionsThisWeek} sessions this week` : 'Browse sessions'}
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
              Join free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Ticker ───────────────────────────────────────── */}
      {tickerItems.length > 0 && (
        <div className="bg-neutral-900/60 border-b border-neutral-800/40 overflow-hidden">
          <div className="flex items-center gap-0 py-2">
            <div className="flex items-center gap-6 animate-ticker whitespace-nowrap px-6">
              {[...tickerItems, ...tickerItems].map((item, i) => (
                <span key={i} className="text-xs text-neutral-500 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-green-500 inline-block flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-32 px-4 sm:px-6">
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

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            {heroLine}
          </p>
          <p className="text-sm text-neutral-600 mb-10">
            Zero cost. Zero commitment. Just show up.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              See sessions this week →
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Create free account
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-neutral-500">
            {sessionsThisWeek > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span><strong className="text-neutral-200">{sessionsThisWeek}</strong> session{sessionsThisWeek !== 1 ? 's' : ''} this week</span>
              </div>
            )}
            {totalMembers > 0 && (
              <div className="flex items-center gap-2">
                <span>👥</span>
                <span><strong className="text-neutral-200">{totalMembers}</strong> member{totalMembers !== 1 ? 's' : ''}</span>
              </div>
            )}
            {newMembersThisWeek > 0 && (
              <div className="flex items-center gap-2">
                <span>📈</span>
                <span><strong className="text-neutral-200">{newMembersThisWeek}</strong> joined this week</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span>🇸🇬</span>
              <span>Singapore only</span>
            </div>
          </div>
        </div>

        {/* Hero photo grid */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { src: '/images/run-club.jpg', alt: 'Run club' },
              { src: '/banner/running.jpg', alt: 'Running together' },
              { src: '/banner/ice-bath.webp', alt: 'Ice bath' },
            ].map((img) => (
              <div key={img.src} className="h-36 sm:h-48 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-neutral-600 mt-3">Real sessions. Real people. Singapore.</p>
        </div>
      </section>

      {/* ── Live Sessions Preview ─────────────────────────── */}
      {upcomingSessions.length > 0 && (
        <section className="px-4 sm:px-6 pb-16 border-b border-neutral-800/60">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-neutral-100">Happening soon</h2>
                <p className="text-sm text-neutral-500">Real sessions. Real people. No login required to browse.</p>
              </div>
              <Link
                href="/browse"
                className="text-sm text-neutral-400 hover:text-white transition-colors"
              >
                See all →
              </Link>
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              {upcomingSessions.map((session) => {
                const attendeeCount = session.userActivities.length
                const emoji = ACTIVITY_EMOJIS[session.categorySlug ?? 'other'] ?? '🏅'
                const hostFirstName = session.user.name?.split(' ')[0] ?? 'Someone'
                const isFree = session.price === 0
                return (
                  <Link
                    key={session.id}
                    href={`/activities/${session.id}`}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{emoji}</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isFree
                          ? 'bg-green-500/15 text-green-400'
                          : 'bg-neutral-800 text-neutral-300'
                      }`}>
                        {isFree ? 'FREE' : `$${session.price}`}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-100 leading-snug mb-2 group-hover:text-white">
                      {session.title}
                    </h3>
                    <div className="space-y-1">
                      {session.startTime && (
                        <p className="text-xs text-neutral-400">
                          📅 {formatSessionTime(session.startTime)}
                        </p>
                      )}
                      {session.city && (
                        <p className="text-xs text-neutral-500 truncate">
                          📍 {session.address ? `${session.address}` : session.city}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <p className="text-xs text-neutral-500">
                        By {hostFirstName}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {attendeeCount > 0
                          ? `${attendeeCount} going`
                          : 'Be first to join'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/sign-up"
                className="inline-block px-6 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Join to see full details & RSVP
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Why solo workouts fail ────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Sound familiar?</h2>
            <p className="text-neutral-400">The three reasons people stop working out — and what fixes them</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: '😔',
                problem: 'You skip the gym when no one\u2019s expecting you',
                fix: 'When someone\u2019s waiting for you at 7am, you show up. Accountability isn\u2019t a willpower problem \u2014 it\u2019s a people problem.',
              },
              {
                emoji: '🏙️',
                problem: 'You\u2019re in Singapore but don\u2019t know anyone',
                fix: 'Expats, locals, newcomers \u2014 everyone here is building their circle. The gym is full of people and somehow completely lonely.',
              },
              {
                emoji: '🥱',
                problem: 'Working out alone gets old fast',
                fix: 'The app can\u2019t replace someone who high-fives you at 6am. Real people make you work harder and enjoy it more.',
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <p className="text-base font-semibold text-neutral-100 mb-3 leading-snug">
                  &ldquo;{item.problem}&rdquo;
                </p>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community photos strip ───────────────────────── */}
      <section className="py-10 border-b border-neutral-800/60 overflow-hidden">
        <div className="flex gap-3 px-4 sm:px-6 overflow-x-auto scrollbar-none pb-1">
          {[
            { src: '/images/hosts/singapore-frontrunners.jpg', alt: 'Singapore Frontrunners' },
            { src: '/images/hosts/run-alone-run-club.jpg', alt: 'Run Alone Run Club' },
            { src: '/images/hosts/sunday-service.jpg', alt: 'Sunday Service' },
            { src: '/images/hosts/slowflo-rc.jpg', alt: 'SlowFlo Run Club' },
            { src: '/images/hosts/caliversity.jpg', alt: 'Caliversity' },
            { src: '/images/community-bonds.jpg', alt: 'Community' },
          ].map((photo) => (
            <div
              key={photo.src}
              className="relative flex-shrink-0 w-48 h-32 sm:w-56 sm:h-36 rounded-2xl overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.src} alt={photo.alt} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-neutral-950/20" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-neutral-600 mt-4 px-4">
          These are the kinds of groups that form on SweatBuddies
        </p>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Three steps. No friction.</h2>
            <p className="text-neutral-400">From &ldquo;I should work out more&rdquo; to actually working out</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'See what\u2019s happening',
                body: 'Browse real sessions posted by real people \u2014 morning runs, gym sessions, yoga, hikes. Filter by time, level, or type. All free to view, no account needed.',
              },
              {
                step: '02',
                title: 'One tap to join',
                body: 'No forms. No fees. No awkward intro emails. Tap join, show up at the meeting point. That\u2019s it.',
              },
              {
                step: '03',
                title: 'You\u2019ll come back',
                body: 'Show up once. You\u2019ll meet people. You\u2019ll want to come back. The hard part is always the first session.',
              },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <p className="text-xs font-bold text-neutral-600 tracking-widest mb-4">{step.step}</p>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Activity types ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Whatever you&apos;re into</h2>
          <p className="text-neutral-400 mb-10">Morning runs, evening yoga, weekend hikes, lunchtime HIIT</p>

          <div className="flex flex-wrap justify-center gap-3">
            {ACTIVITY_TYPES.map((type) => (
              <Link key={type} href={`/browse?type=${type}`}>
                <ActivityBadge type={type} size="md" className="cursor-pointer hover:opacity-80 transition-opacity" />
              </Link>
            ))}
          </div>

          <p className="mt-8 text-sm text-neutral-600">
            Can&apos;t find your thing?{' '}
            <Link href="/sign-up" className="text-neutral-400 hover:text-white underline underline-offset-2 transition-colors">
              Host your own session
            </Link>
            {' '}in 2 minutes.
          </p>
        </div>
      </section>

      {/* ── First-timers ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60 bg-neutral-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-10 sm:gap-16">
            <div className="w-full sm:w-80 h-64 sm:h-72 rounded-2xl overflow-hidden flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/connect-people.webp"
                alt="People connecting at a workout"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">First-timers encouraged</h2>
              <p className="text-neutral-400 text-lg leading-relaxed mb-6">
                Everyone remembers their first session. It&apos;s awkward for about 4 minutes, then someone
                cracks a joke and you forget you were ever nervous.
              </p>
              <p className="text-neutral-500 text-sm">
                No fitness test. No minimum commitment. No judgment.
                The only rule: show up.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            {totalMembers > 0
              ? `Join ${totalMembers} people working out together in Singapore`
              : 'Your next workout partner is already here'}
          </h2>
          <p className="text-neutral-400 text-lg mb-3">
            Free. Always.
          </p>
          <p className="text-neutral-600 text-sm mb-10">
            No subscription. No premium tier. No upsell. Just people who want to work out together.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
            >
              Create free account
            </Link>
            <Link
              href="/browse"
              className="inline-block px-10 py-4 bg-transparent text-neutral-300 text-lg font-semibold rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors"
            >
              Browse first
            </Link>
          </div>
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
            <Link href="/browse" className="hover:text-neutral-300 transition-colors">Browse sessions</Link>
            <Link href="/sign-up" className="hover:text-neutral-300 transition-colors">Sign up</Link>
            <a href="mailto:support@sweatbuddies.sg" className="hover:text-neutral-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
