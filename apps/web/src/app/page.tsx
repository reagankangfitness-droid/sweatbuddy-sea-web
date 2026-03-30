import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Fitness Sessions Near You',
  description:
    'Discover fitness and wellness sessions happening near you. Running, yoga, HIIT, cold plunge, cycling — join in 2 taps.',
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
        categorySlug: true,
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

  const categoryEmoji = Object.fromEntries(ACTIVITY_TYPES.map((a) => [a.key, a.emoji]))

  function formatSessionTime(date: Date): string {
    const TZ = 'Asia/Singapore'
    const diff = date.getTime() - now.getTime()
    const hours = diff / (1000 * 60 * 60)

    // Use timezone-aware formatting for all cases
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

  return (
    <div className="min-h-screen bg-[#FFFBF8] text-[#1A1A1A]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 bg-[#FFFBF8]/85 backdrop-blur-xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Logo size={32} />
          <Link
            href="/buddy"
            className="px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:bg-black transition-all"
          >
            Open app
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="px-5 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.08] tracking-tight mb-5">
            Sweat is better
            <span className="block text-[#71717A]">shared.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#4A4A5A] max-w-md mx-auto mb-8 leading-relaxed">
            Find fitness sessions happening near you. Join in 2 taps.
          </p>

          <Link
            href="/buddy"
            className="inline-block px-8 py-4 bg-[#1A1A1A] text-white text-base font-semibold rounded-full hover:bg-black transition-all shadow-lg hover:shadow-xl"
          >
            See what&apos;s happening →
          </Link>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <p className="text-sm text-[#71717A]">
              <span className="font-semibold text-[#1A1A1A]">{sessionsThisWeek}</span> sessions this week
              {communityCount > 0 && <> · <span className="font-semibold text-[#1A1A1A]">{communityCount}</span> crews</>}
            </p>
          </div>

          {/* City pills */}
          {cities.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {cities.map((c) => (
                <span key={c.name} className="px-3 py-1 rounded-full bg-white border border-black/[0.06] text-xs text-[#71717A]">
                  {c.name} <span className="font-semibold text-[#4A4A5A]">{c.communityCount}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Happening soon ── */}
      {upcomingSessions.length > 0 && (
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto">
            <p className="text-xs font-semibold text-[#9A9AAA] uppercase tracking-widest mb-4 text-center">
              Happening soon
            </p>
            <div className="space-y-2">
              {upcomingSessions.map((s) => {
                const going = s._count.userActivities
                return (
                  <Link
                    key={s.id}
                    href="/buddy"
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] transition-all"
                  >
                    <span className="text-2xl flex-shrink-0">{categoryEmoji[s.categorySlug ?? ''] ?? '🏅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A] truncate">{s.title}</p>
                      <p className="text-xs text-[#71717A] truncate">
                        {s.startTime ? formatSessionTime(s.startTime) : ''}
                        {s.address ? ` · ${s.address.split(',')[0]}` : s.city ? ` · ${s.city}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-[#9A9AAA] flex-shrink-0">
                      {going > 0 ? `${going} going` : 'Be first'}
                    </span>
                  </Link>
                )
              })}
            </div>
            <div className="text-center mt-4">
              <Link href="/buddy" className="text-xs font-semibold text-[#71717A] hover:text-[#1A1A1A] transition-colors">
                See all sessions →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="px-5 py-16 border-t border-black/[0.04]">
        <div className="max-w-lg mx-auto">
          <div className="space-y-8">
            {[
              { step: '1', title: 'Browse', body: 'See sessions on the map. Filter by what moves you.' },
              { step: '2', title: 'Join', body: 'Tap "I\'m in." That\'s it. No forms, no commitments.' },
              { step: '3', title: 'Show up', body: 'Meet your crew. Come back next week.' },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">{s.title}</h3>
                  <p className="text-xs text-[#71717A] mt-0.5">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-5 py-20 border-t border-black/[0.04]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 tracking-tight">
            The right crew changes everything.
          </h2>
          <p className="text-sm text-[#4A4A5A] mb-8 max-w-sm mx-auto">
            Every 5am alarm answered. Every PR earned. Every &apos;same time next week?&apos;
          </p>
          <Link
            href="/buddy"
            className="inline-block px-8 py-4 bg-[#1A1A1A] text-white text-base font-semibold rounded-full hover:bg-black transition-all shadow-lg"
          >
            See what&apos;s happening →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/[0.04] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Logo size={20} />
            <span className="text-xs text-[#71717A]">&copy; 2026 SweatBuddies</span>
          </div>
          <div className="flex gap-4 text-xs text-[#71717A]">
            <Link href="/buddy" className="hover:text-[#1A1A1A] transition-colors">Discover</Link>
            <Link href="/communities" className="hover:text-[#1A1A1A] transition-colors">Crews</Link>
            <Link href="/support" className="hover:text-[#1A1A1A] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
