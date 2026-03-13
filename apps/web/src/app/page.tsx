import Link from 'next/link'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import { prisma } from '@/lib/prisma'
import { format, isToday, isTomorrow } from 'date-fns'
import { ACTIVITY_TYPES as ACTIVITY_TYPES_CONFIG } from '@/lib/activity-types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Fitness Sessions Posted by Real People',
  description: 'Browse and join fitness sessions posted by people near you. Runs, yoga, gym, hikes and more.',
}

const ACTIVITY_EMOJIS: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES_CONFIG.map((t) => [t.key, t.emoji])
)

const COMMUNITY_PHOTOS = [
  { src: '/images/hosts/singapore-frontrunners.jpg', caption: 'Singapore Frontrunners' },
  { src: '/images/hosts/run-alone-run-club.jpg', caption: 'Run Alone Run Club' },
  { src: '/images/hosts/sunday-service.jpg', caption: 'Sunday Service' },
  { src: '/images/hosts/slowflo-rc.jpg', caption: 'SlowFlo RC' },
  { src: '/images/hosts/caliversity.jpg', caption: 'Caliversity' },
  { src: '/images/community-bonds.jpg', caption: 'SweatBuddies Community' },
]

function formatSessionTime(date: Date): string {
  if (isToday(date)) return `Today · ${format(date, 'h:mm a')}`
  if (isTomorrow(date)) return `Tomorrow · ${format(date, 'h:mm a')}`
  return format(date, 'EEE, MMM d · h:mm a')
}

export default async function HomePage() {
  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [sessionsThisWeek, totalMembers, newMembersThisWeek, upcomingSessions, recentJoins, activityCounts] =
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
      prisma.activity.groupBy({
        by: ['categorySlug'],
        where: {
          status: 'PUBLISHED',
          deletedAt: null,
          activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
          startTime: { gte: now },
        },
        _count: { id: true },
      }),
    ])

  // Count per type — tier 1+2 always shown, tier 3 only if sessions exist
  const countByType: Record<string, number> = {}
  for (const row of activityCounts) {
    if (row.categorySlug) countByType[row.categorySlug] = row._count.id
  }
  const displayTypes = ACTIVITY_TYPES_CONFIG
    .filter((cfg) => cfg.tier <= 2 || (countByType[cfg.key] ?? 0) > 0)
    .map((cfg) => ({ type: cfg.key, count: countByType[cfg.key] ?? 0, isNew: cfg.isNew ?? false }))
    .sort((a, b) => {
      // Types with sessions first, then by count desc, then stable order
      if (a.count > 0 && b.count === 0) return -1
      if (a.count === 0 && b.count > 0) return 1
      return b.count - a.count
    })

  // Ticker items from real joins
  const tickerItems: string[] = recentJoins
    .filter((j) => j.user.name)
    .map((j) => {
      const firstName = j.user.name!.split(' ')[0]
      const emoji = ACTIVITY_EMOJIS[j.activity.categorySlug ?? 'other'] ?? '🏅'
      return `${firstName} joined ${emoji} ${j.activity.title}`
    })

  if (tickerItems.length < 4) {
    if (sessionsThisWeek > 0) tickerItems.push(`${sessionsThisWeek} sessions this week`)
    if (newMembersThisWeek > 0) tickerItems.push(`${newMembersThisWeek} new members this week`)
    tickerItems.push('Running · Yoga · Gym · Hiking · More')
    tickerItems.push('New sessions added daily')
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
              Join
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Ticker ───────────────────────────────────────── */}
      {tickerItems.length > 0 && (
        <div className="bg-neutral-900/60 border-b border-neutral-800/40 overflow-hidden">
          <div className="flex items-center py-2">
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
            SweatBuddies
          </p>

          <h1 className="text-5xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Fitness sessions,
            <span className="block text-neutral-400">posted by real people</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            {sessionsThisWeek > 0
              ? `${sessionsThisWeek} session${sessionsThisWeek !== 1 ? 's' : ''} happening this week — posted by people near you.`
              : totalMembers > 0
              ? `${totalMembers} members posting and joining sessions near you.`
              : 'Browse runs, yoga, gym sessions, hikes and more — posted by people near you.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              See what&apos;s on →
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Create account
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
          </div>
        </div>

        {/* Hero photo grid */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { src: '/images/run-club.jpg', alt: 'Run club' },
              { src: '/banner/running.jpg', alt: 'Running session' },
              { src: '/banner/ice-bath.webp', alt: 'Ice bath session' },
            ].map((img) => (
              <div key={img.src} className="h-36 sm:h-48 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-neutral-600 mt-3">Real sessions. Real people.</p>
        </div>
      </section>

      {/* ── Sessions (always rendered) ────────────────────── */}
      <section className="px-4 sm:px-6 pb-16 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Happening soon</h2>
              <p className="text-sm text-neutral-500">Browse without an account.</p>
            </div>
            <Link href="/browse" className="text-sm text-neutral-400 hover:text-white transition-colors">
              See all →
            </Link>
          </div>

          {upcomingSessions.length > 0 ? (
            <div className="grid sm:grid-cols-3 gap-3">
              {upcomingSessions.map((session) => {
                const attendeeCount = session.userActivities.length
                const emoji = ACTIVITY_EMOJIS[session.categorySlug ?? 'other'] ?? '🏅'
                const hostFirstName = session.user.name?.split(' ')[0] ?? 'Someone'
                return (
                  <Link
                    key={session.id}
                    href={`/activities/${session.id}`}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-4 transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{emoji}</span>
                      {session.price > 0 && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                          ${session.price}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-100 leading-snug mb-2 group-hover:text-white">
                      {session.title}
                    </h3>
                    <div className="space-y-1">
                      {session.startTime && (
                        <p className="text-xs text-neutral-400">📅 {formatSessionTime(session.startTime)}</p>
                      )}
                      {session.city && (
                        <p className="text-xs text-neutral-500 truncate">
                          📍 {session.address ? session.address : session.city}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 pt-3 border-t border-neutral-800 flex items-center justify-between">
                      <p className="text-xs text-neutral-500">By {hostFirstName}</p>
                      <p className="text-xs text-neutral-400">
                        {attendeeCount > 0 ? `${attendeeCount} going` : 'Be first'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            /* Empty state — show what a session looks like */
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { emoji: '🏃', title: 'Morning Run — East Coast Park', time: 'Sat 7:00 AM', location: 'East Coast Park' },
                { emoji: '🧘', title: 'Yoga in the Park', time: 'Sun 8:00 AM', location: 'Botanic Gardens' },
                { emoji: '🏋️', title: 'Gym Session — Push Day', time: 'Mon 6:30 PM', location: 'Tanjong Pagar' },
              ].map((example, i) => (
                <div
                  key={i}
                  className="relative bg-neutral-900 border border-neutral-800 border-dashed rounded-2xl p-4 opacity-40"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{example.emoji}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-100 leading-snug mb-2">{example.title}</h3>
                  <div className="space-y-1">
                    <p className="text-xs text-neutral-400">📅 {example.time}</p>
                    <p className="text-xs text-neutral-500">📍 {example.location}</p>
                  </div>
                </div>
              ))}
              <div className="sm:col-span-3 text-center pt-2">
                <p className="text-sm text-neutral-600 mb-3">Sessions are being added. Be the first to post one.</p>
                <Link
                  href="/sign-up"
                  className="inline-block px-5 py-2 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
                >
                  Post a session →
                </Link>
              </div>
            </div>
          )}

          {upcomingSessions.length > 0 && (
            <div className="mt-6 text-center">
              <Link
                href="/sign-up"
                className="inline-block px-6 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Join to RSVP →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Activity types — sessions-only, sorted by count ── */}
      <section className="py-20 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Whatever you&apos;re into</h2>
            <p className="text-neutral-400">Morning runs, evening yoga, weekend hikes, lunchtime HIIT</p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {displayTypes.map(({ type, count, isNew }) => (
              <Link key={type} href={`/browse?type=${type}`} className="group flex flex-col items-center gap-1">
                <div className="relative">
                  <ActivityBadge type={type} size="md" className="cursor-pointer group-hover:opacity-80 transition-opacity" />
                  {isNew && count === 0 && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 leading-none border border-emerald-500/30">
                      NEW
                    </span>
                  )}
                </div>
                {count > 0 ? (
                  <span className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
                    {count} session{count !== 1 ? 's' : ''}
                  </span>
                ) : isNew ? (
                  <span className="text-xs text-emerald-600 group-hover:text-emerald-400 transition-colors">
                    Coming soon
                  </span>
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community photos — with real captions ────────── */}
      <section className="py-10 border-b border-neutral-800/60 overflow-hidden">
        <p className="text-xs text-neutral-600 text-center mb-6 px-4 uppercase tracking-widest font-semibold">
          Communities that meet on SweatBuddies
        </p>
        <div className="flex gap-4 px-4 sm:px-6 overflow-x-auto scrollbar-none pb-1">
          {COMMUNITY_PHOTOS.map((photo) => (
            <div key={photo.src} className="flex-shrink-0 flex flex-col items-center gap-2">
              <div className="relative w-44 h-28 sm:w-52 sm:h-32 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.caption} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-neutral-950/20" />
              </div>
              <span className="text-xs text-neutral-500 font-medium">{photo.caption}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Three steps. No friction.</h2>
            <p className="text-neutral-400">Browse, join, show up.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'See what\u2019s posted',
                body: 'Browse sessions posted by real people \u2014 morning runs, gym sessions, yoga, hikes. Filter by time, level, or type. No account needed.',
              },
              {
                step: '02',
                title: 'One tap to join',
                body: 'No forms. No awkward intro emails. Tap join, show up at the meeting point. That\u2019s it.',
              },
              {
                step: '03',
                title: 'You\u2019ll know someone by the end',
                body: 'Show up once. You\u2019ll know someone\u2019s name by the end of the session. That\u2019s how regulars get made.',
              },
            ].map((step, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7">
                <p className="text-xs font-bold text-neutral-600 tracking-widest mb-4">{step.step}</p>
                <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Every kind of session ─────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Every kind of session</h2>
            <p className="text-neutral-400">From early morning runs to evening yoga — something for every schedule</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: '🏃',
                title: 'Run communities',
                body: 'Morning routes, track sessions, trail runs. Find a pace group that matches yours.',
              },
              {
                emoji: '🧘',
                title: 'Mind & body',
                body: 'Yoga, pilates, meditation. Park sessions, studio meetups, rooftop flows.',
              },
              {
                emoji: '🏋️',
                title: 'Strength & conditioning',
                body: 'Gym sessions, HIIT, bootcamp, calisthenics. All levels, all formats.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7">
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-base font-semibold text-neutral-100 mb-3">{item.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            {totalMembers > 0
              ? `${totalMembers} people already posting and joining sessions.`
              : 'Real people posting sessions near you.'}
          </h2>
          <p className="text-neutral-400 text-lg mb-10">
            Sessions added every day. Browse now, join when you&apos;re ready.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/sign-up"
              className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
            >
              See what&apos;s on
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
            <span>© 2026 SweatBuddies</span>
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
