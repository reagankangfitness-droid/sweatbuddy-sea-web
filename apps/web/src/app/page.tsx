import Link from 'next/link'
import { Metadata } from 'next'
import { LogoWithText } from '@/components/logo'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — The OS for Fitness Community Leaders',
  description:
    'Stop juggling WhatsApp, Instagram, PayNow and spreadsheets. One tool to post sessions, track who shows up, and grow your crew.',
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
          <LogoWithText size={28} color="#FF6B35" textColor="#FF6B35" />
          <div className="flex items-center gap-3">
            <Link href="/buddy" className="text-sm text-[#71717A] hover:text-[#1A1A1A] transition-colors hidden sm:inline">
              Explore sessions
            </Link>
            <Link
              href="/communities"
              className="px-5 py-2.5 bg-[#1A1A1A] text-white text-sm font-semibold rounded-full hover:bg-black transition-all"
            >
              Start your crew
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — for hosts ── */}
      <section className="relative px-5 pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        {/* Background photo — subtle, blurred */}
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-[0.15]" />
        </div>
        {/* Emoji rain */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {['🏃','🧘','💪','🚴','🧊','🏊','🥊','🤸','🏓','🏋️','🥾','🏐','💃','🎾'].map((emoji, i) => (
            <span
              key={i}
              className="absolute text-3xl select-none"
              style={{
                left: `${(i * 7.3 + 3) % 100}%`,
                top: '-40px',
                opacity: 0.15,
                animation: `emojifall ${10 + (i % 5) * 2}s linear ${i * 0.6}s infinite`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>
        <style>{`
          @keyframes emojifall {
            0% { transform: translateY(-40px) rotate(0deg); opacity: 0.15; }
            10% { opacity: 0.18; }
            80% { opacity: 0.12; }
            100% { transform: translateY(calc(100vh + 40px)) rotate(35deg); opacity: 0; }
          }
        `}</style>

        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-bold leading-[1.1] tracking-tight mb-5">
            Stop juggling 5 apps to{' '}
            <span className="bg-gradient-to-r from-[#FF6B35] to-[#FFB347] bg-clip-text text-transparent">
              run your crew.
            </span>
          </h1>

          <p className="text-base text-[#4A4A5A] max-w-md mx-auto mb-8 leading-relaxed">
            WhatsApp. Instagram. PayNow. Google Sheets. Linktree.
            <span className="block mt-1 font-medium text-[#1A1A1A]">One tool replaces all of them.</span>
          </p>

          <Link
            href="/communities"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] text-white text-base font-semibold rounded-full hover:from-[#E8612F] hover:to-[#FF6B35] transition-all shadow-lg shadow-[#FF6B35]/20"
          >
            Set up your crew — free →
          </Link>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-2 mt-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B35] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B35]" />
            </span>
            <p className="text-sm text-[#71717A]">
              <span className="font-semibold text-[#1A1A1A]">{communityCount}</span> crews
              {sessionsThisWeek > 0 && <> · <span className="font-semibold text-[#1A1A1A]">{sessionsThisWeek}</span> sessions this week</>}
              {cities.length > 0 && <> · {cities.length} cities</>}
            </p>
          </div>
        </div>
      </section>

      {/* ── Pain points ── */}
      <section className="px-5 pb-16">
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { emoji: '📱', pain: 'WhatsApp groups don\u2019t track who shows up' },
            { emoji: '📊', pain: 'Spreadsheets can\u2019t send reminders' },
            { emoji: '🔗', pain: 'Linktree can\u2019t take RSVPs' },
          ].map((p) => (
            <div key={p.emoji} className="bg-white rounded-xl shadow-sm p-4 text-center">
              <span className="text-2xl block mb-2">{p.emoji}</span>
              <p className="text-xs text-[#4A4A5A] leading-relaxed">{p.pain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What you get ── */}
      <section className="px-5 pb-16 border-t border-black/[0.04] pt-16">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 tracking-tight">
            Everything your crew needs. Nothing it doesn&apos;t.
          </h2>
          <div className="space-y-6">
            {[
              { icon: '⚡', title: 'Post sessions in 30 seconds', body: 'Pick an activity, set a time, done. Your crew sees it instantly.' },
              { icon: '👥', title: 'See who\u2019s coming', body: 'Names, not numbers. Know who\u2019s new and who\u2019s a regular.' },
              { icon: '📣', title: 'Your community page', body: 'A home for your crew. Members, sessions, schedule — all in one link.' },
              { icon: '📍', title: 'Show up on the map', body: 'People nearby discover your sessions. Organic growth, no ads.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-[#1A1A1A]">{f.title}</h3>
                  <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#9A9AAA] mt-8">Free. No lock-in. No fees on free events.</p>
        </div>
      </section>

      {/* ── City pills (social proof) ── */}
      {cities.length > 0 && (
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-4">Crews across</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {cities.map((c) => (
                <span key={c.name} className="px-3 py-1.5 rounded-full bg-white shadow-sm text-xs text-[#71717A]">
                  {c.name} <span className="font-semibold text-[#4A4A5A]">{c.communityCount}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Divider — switch to attendee audience ── */}
      <section className="px-5 py-12 border-t border-black/[0.04]">
        <div className="max-w-lg mx-auto text-center">
          <p className="text-xs text-[#9A9AAA]">— or just looking to join? —</p>
        </div>
      </section>

      {/* ── Attendee section ── */}
      <section className="px-5 pb-16">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Find sessions near you.
          </h2>
          <p className="text-sm text-[#4A4A5A] mb-6">
            Running, yoga, HIIT, cold plunge, cycling — whatever moves you.
          </p>
          <Link
            href="/buddy"
            className="inline-block px-8 py-4 bg-[#1A1A1A] text-white text-base font-semibold rounded-full hover:bg-black transition-all shadow-lg"
          >
            See what&apos;s happening →
          </Link>
        </div>
      </section>

      {/* ── Happening soon ── */}
      {upcomingSessions.length > 0 && (
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto">
            <p className="text-[11px] text-[#9A9AAA] uppercase tracking-widest mb-4 text-center">
              Happening soon
            </p>
            <div className="space-y-1">
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
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="px-5 py-20 border-t border-black/[0.04]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight">
            Ready to stop duct-taping your community?
          </h2>
          <p className="text-xs text-[#71717A] mb-6">15 seconds to set up. Free forever for free events.</p>
          <Link
            href="/communities"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF8B55] text-white text-base font-semibold rounded-full hover:from-[#E8612F] hover:to-[#FF6B35] transition-all shadow-lg shadow-[#FF6B35]/20"
          >
            Set up your crew →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-black/[0.04] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#FF6B35" textColor="#9A9AAA" />
            <span className="text-xs text-[#71717A]">&copy; 2026</span>
          </div>
          <div className="flex gap-4 text-xs text-[#71717A]">
            <Link href="/buddy" className="hover:text-[#1A1A1A] transition-colors">Discover</Link>
            <Link href="/communities" className="hover:text-[#1A1A1A] transition-colors">Crews</Link>
            <Link href="/hub" className="hover:text-[#1A1A1A] transition-colors">Host Hub</Link>
            <Link href="/support" className="hover:text-[#1A1A1A] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
