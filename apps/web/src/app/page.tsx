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

  const [communityCount, sessionsThisWeek, upcomingSessions, cities, communityImages] = await Promise.all([
    prisma.community.count({ where: { isActive: true } }),
    prisma.activity.count({
      where: {
        status: 'PUBLISHED', deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        startTime: { gte: now, lte: oneWeek },
      },
    }),
    prisma.activity.findMany({
      where: {
        status: 'PUBLISHED', deletedAt: null,
        activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
        startTime: { gte: now },
      },
      select: {
        id: true, title: true, categorySlug: true, startTime: true,
        city: true, address: true, imageUrl: true,
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
    // Fetch communities with cover images for the photo scroll
    prisma.community.findMany({
      where: { isActive: true, coverImage: { not: null } },
      select: { name: true, coverImage: true, slug: true },
      orderBy: { memberCount: 'desc' },
      take: 8,
    }),
  ])

  // Also grab sessions with images for the scroll
  const sessionImages = await prisma.activity.findMany({
    where: { status: 'PUBLISHED', deletedAt: null, imageUrl: { not: null } },
    select: { title: true, imageUrl: true, id: true },
    orderBy: { startTime: 'desc' },
    take: 8,
  })

  const scrollPhotos = [
    ...communityImages.filter((c) => c.coverImage).map((c) => ({ src: c.coverImage!, label: c.name, href: `/communities/${c.slug}` })),
    ...sessionImages.filter((s) => s.imageUrl).map((s) => ({ src: s.imageUrl!, label: s.title, href: `/activities/${s.id}` })),
  ].slice(0, 8)

  // Fallback if no DB images
  const fallbackPhotos = [
    { src: '/banner/running.jpg', label: 'Run Clubs', href: '/buddy' },
    { src: '/images/hero-2.jpg', label: 'Yoga Groups', href: '/buddy' },
    { src: '/banner/athletics.jpg', label: 'Bootcamps', href: '/buddy' },
    { src: '/images/hero-3.jpg', label: 'Cold Plunge', href: '/buddy' },
    { src: '/banner/ice-bath.webp', label: 'Wellness', href: '/buddy' },
  ]

  const photos = scrollPhotos.length >= 3 ? scrollPhotos : fallbackPhotos

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
    <div className="min-h-screen bg-[#0D0D0D] text-[#FAFAFA]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <LogoWithText size={28} color="#FFFFFF" textColor="#FFFFFF" />
          <div className="flex items-center gap-3">
            <Link href="/buddy" className="text-sm text-[#999999] hover:text-white transition-colors hidden sm:inline">
              Explore
            </Link>
            <Link
              href="/communities"
              className="px-5 py-2.5 bg-white text-black text-sm font-bold uppercase tracking-wide rounded-full hover:bg-neutral-200 transition-all"
            >
              Start your crew
            </Link>
          </div>
        </div>
      </header>

      {/* ── S1: Hero ── */}
      <section className="relative px-5 pt-16 pb-12 sm:pt-24 sm:pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/hero-bg.jpg" alt="" className="w-full h-full object-cover opacity-[0.18]" />
        </div>
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {['🏃','🧘','💪','🚴','🧊','🏊','🥊','🤸','🏓','🏋️','🥾','🏐','💃','🎾'].map((emoji, i) => (
            <span key={i} className="absolute text-3xl select-none" style={{
              left: `${(i * 7.3 + 3) % 100}%`, top: '-40px', opacity: 0.08,
              animation: `emojifall ${10 + (i % 5) * 2}s linear ${i * 0.6}s infinite`,
            }}>{emoji}</span>
          ))}
        </div>
        <style>{`@keyframes emojifall { 0% { transform: translateY(-40px) rotate(0deg); opacity: 0.08; } 10% { opacity: 0.1; } 80% { opacity: 0.05; } 100% { transform: translateY(calc(100vh + 40px)) rotate(35deg); opacity: 0; } }`}</style>

        <div className="relative max-w-2xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold leading-[1.05] tracking-tight mb-5">
            Every session starts{' '}
            <span className="bg-gradient-to-r from-white to-[#999999] bg-clip-text text-transparent">
              here.
            </span>
          </h1>
          <p className="text-base text-[#999999] max-w-md mx-auto mb-8 leading-relaxed">
            Find your next run, class, or workout — or host your own.
          </p>
          <Link
            href="/communities"
            className="inline-block px-8 py-4 bg-white text-black text-base font-bold uppercase tracking-wide rounded-full hover:bg-neutral-200 transition-all"
          >
            Get started — free →
          </Link>
          <div className="flex items-center justify-center gap-2 mt-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            <p className="text-sm text-[#666666]">
              <span className="font-semibold text-[#FAFAFA]">{communityCount}</span> crews
              {sessionsThisWeek > 0 && <> · <span className="font-semibold text-[#FAFAFA]">{sessionsThisWeek}</span> sessions this week</>}
              {cities.length > 0 && <> · {cities.length} cities</>}
            </p>
          </div>
        </div>
      </section>

      {/* ── S2: Photo scroll (SweatPals-inspired) ── */}
      <section className="py-10 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto no-scrollbar px-5">
          {photos.map((p, i) => (
            <Link key={i} href={p.href} className="flex-shrink-0 group relative w-48 h-64 sm:w-56 sm:h-72 rounded-2xl overflow-hidden shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.src} alt={p.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-white text-xs font-semibold truncate">{p.label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── S3: Pain points ── */}
      <section className="px-5 pb-16">
        <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { emoji: '📱', pain: 'WhatsApp groups lose track' },
            { emoji: '📊', pain: 'Spreadsheets don\u2019t send reminders' },
            { emoji: '🔗', pain: 'Linktree can\u2019t take RSVPs' },
          ].map((p) => (
            <div key={p.emoji} className="bg-[#1A1A1A] rounded-xl shadow-sm p-4 text-center">
              <span className="text-2xl block mb-2">{p.emoji}</span>
              <p className="text-xs text-[#999999] leading-relaxed">{p.pain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── S4: Split pitch — Hosts / Members (SweatPals-inspired) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 min-h-[400px]">
        {/* Left — For Hosts */}
        <div className="bg-[#1A1A1A] px-8 py-16 flex flex-col justify-center">
          <span className="inline-block px-3 py-1 rounded-full border border-white/20 text-[11px] text-white/70 font-medium uppercase tracking-widest mb-6 w-fit">
            FOR HOSTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
            Run your crew.
          </h2>
          <p className="text-sm text-white/60 mb-6 leading-relaxed max-w-sm">
            Host sessions in 30 seconds. See who&apos;s coming. Send reminders. Track attendance. Grow organically.
          </p>
          <Link
            href="/communities"
            className="inline-block px-6 py-3 bg-white text-black text-sm font-bold uppercase tracking-wide rounded-full w-fit hover:bg-neutral-200 transition-all"
          >
            Start hosting →
          </Link>
        </div>

        {/* Right — For Members */}
        <div className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/banner/running.jpg" alt="People running together" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative px-8 py-16 flex flex-col justify-center h-full">
            <span className="inline-block px-3 py-1 rounded-full border border-white/30 text-[11px] text-white/80 font-medium uppercase tracking-widest mb-6 w-fit">
              For Members
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight mb-4">
              Find your session.
            </h2>
            <p className="text-sm text-white/70 mb-6 leading-relaxed max-w-sm">
              Running, yoga, HIIT, cold plunge — whatever moves you. Browse sessions and join in 2 taps.
            </p>
            <Link
              href="/buddy"
              className="inline-block px-6 py-3 border border-white/20 text-white text-sm font-bold uppercase tracking-wide rounded-full w-fit hover:bg-white/10 transition-all"
            >
              Browse sessions →
            </Link>
          </div>
        </div>
      </section>

      {/* ── S5: What you get ── */}
      <section className="px-5 py-16">
        <div className="max-w-lg mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-center mb-8 tracking-tight">
            Everything your crew needs.
          </h2>
          <div className="space-y-6">
            {[
              { icon: '⚡', title: 'Host sessions in 30 seconds', body: 'Pick an activity, set a time, done. Your crew sees it instantly.' },
              { icon: '👥', title: 'See who\u2019s coming', body: 'Names, not numbers. Know who\u2019s new and who\u2019s a regular.' },
              { icon: '📣', title: 'Your crew page', body: 'A home for your crew. Members, sessions, schedule — all in one link.' },
              { icon: '📍', title: 'Show up on the map', body: 'People nearby discover your sessions. Organic growth, no ads.' },
            ].map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-[#FAFAFA]">{f.title}</h3>
                  <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-[#666666] mt-8">Free. No lock-in. No fees on free events.</p>
        </div>
      </section>

      {/* ── S6: City pills ── */}
      {cities.length > 0 && (
        <section className="px-5 pb-12">
          <div className="max-w-lg mx-auto text-center">
            <p className="text-[11px] text-[#666666] uppercase tracking-widest mb-4">Crews across</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {cities.map((c) => (
                <span key={c.name} className="px-3 py-1.5 rounded-full bg-[#1A1A1A] shadow-sm text-xs text-[#666666]">
                  {c.name} <span className="font-semibold text-[#999999]">{c.communityCount}</span>
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── S7: Happening soon ── */}
      {upcomingSessions.length > 0 && (
        <section className="px-5 pb-16">
          <div className="max-w-lg mx-auto">
            <p className="text-[11px] text-[#666666] uppercase tracking-widest mb-4 text-center">Happening soon</p>
            <div className="space-y-1">
              {upcomingSessions.map((s) => {
                const going = s._count.userActivities
                return (
                  <Link key={s.id} href="/buddy" className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-all">
                    <span className="text-2xl flex-shrink-0">{categoryEmoji[s.categorySlug ?? ''] ?? '🏅'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#FAFAFA] truncate">{s.title}</p>
                      <p className="text-xs text-[#666666] truncate">
                        {s.startTime ? formatSessionTime(s.startTime) : ''}
                        {s.address ? ` · ${s.address.split(',')[0]}` : s.city ? ` · ${s.city}` : ''}
                      </p>
                    </div>
                    <span className="text-xs text-[#666666] flex-shrink-0">{going > 0 ? `${going} going` : 'Be the first'}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── S8: Final CTA ── */}
      <section className="px-5 py-20 border-t border-white/[0.06]">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 tracking-tight">
            Your crew is waiting.
          </h2>
          <p className="text-xs text-[#666666] mb-6">Set up in 15 seconds. Free.</p>
          <Link
            href="/communities"
            className="inline-block px-8 py-4 bg-white text-black text-base font-bold uppercase tracking-wide rounded-full hover:bg-neutral-200 transition-all"
          >
            Get started →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <LogoWithText size={16} color="#FFFFFF" textColor="#666666" />
            <span className="text-xs text-[#666666]">&copy; 2026</span>
          </div>
          <div className="flex gap-4 text-xs text-[#666666]">
            <Link href="/buddy" className="hover:text-[#FAFAFA] transition-colors">Discover</Link>
            <Link href="/communities" className="hover:text-[#FAFAFA] transition-colors">Crews</Link>
            <Link href="/hub" className="hover:text-[#FAFAFA] transition-colors">Host Hub</Link>
            <Link href="/support" className="hover:text-[#FAFAFA] transition-colors">Help</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
