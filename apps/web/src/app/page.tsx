import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { FadeInSection } from '@/components/FadeInSection'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { SUPPORT_EMAIL } from '@/config/constants'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Discover Fitness & Wellness Experiences',
  description:
    'Discover fitness and wellness experiences. Sunrise yoga, beach bootcamps, run clubs, cold plunge socials — whatever moves you, it\'s happening.',
}

// Fallback cover photos for communities without a cover image
const CATEGORY_COVER_FALLBACKS: Record<string, string> = {
  running: '/banner/running.jpg',
  yoga: '/images/hero-2.jpg',
  swimming: '/banner/athletics.jpg',
  gym: '/images/hero-1.webp',
  bootcamp: '/banner/athletics.jpg',
  hiking: '/images/hero-3.jpg',
  cycling: '/banner/running.jpg',
  badminton: '/images/community-bonds.jpg',
  pilates: '/images/hero-2.jpg',
  cold_plunge: '/images/hero-3.jpg',
  padel: '/images/community-bonds.jpg',
  combat_fitness: '/banner/athletics.jpg',
  pickleball: '/images/community-bonds.jpg',
}

const CATEGORY_CARDS = [
  { emoji: '🏃', label: 'Running Clubs', vibe: 'Find your pace, push your limits', slug: 'running' },
  { emoji: '🧘', label: 'Yoga Groups', vibe: 'Deepen your practice together', slug: 'yoga' },
  { emoji: '🏊', label: 'Swimming Squads', vibe: 'Faster laps, better form', slug: 'swimming' },
  { emoji: '🎾', label: 'Tennis Crews', vibe: 'Sharpen your game, find your match', slug: 'padel' },
  { emoji: '🏋️', label: 'Gym & Strength', vibe: 'Spotters, PRs, no skipped days', slug: 'gym' },
  { emoji: '🏸', label: 'Badminton Groups', vibe: 'Smash harder, play smarter', slug: 'badminton' },
  { emoji: '🥾', label: 'Hiking Crews', vibe: 'Conquer trails, earn the view', slug: 'hiking' },
  { emoji: '⚡', label: 'HIIT & Bootcamp', vibe: 'Outwork yesterday, together', slug: 'bootcamp' },
  { emoji: '🧊', label: 'Cold Plunge', vibe: 'Build resilience, feel alive', slug: 'cold_plunge' },
]

export default async function HomePage() {
  const [featuredCommunities, communityCount, memberCount, sessionsThisWeek] =
    await Promise.all([
      prisma.community.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { memberCount: 'desc' },
        include: {
          createdBy: { select: { name: true, imageUrl: true } },
          city: { select: { name: true } },
        },
      }),
      prisma.community.count({ where: { isActive: true } }),
      prisma.communityMember.count(),
      prisma.activity.count({
        where: {
          startTime: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

  const categoryEmoji = Object.fromEntries(
    ACTIVITY_TYPES.map((a) => [a.key, a.emoji]),
  )

  const showStats =
    communityCount >= 10 && memberCount >= 100

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-neutral-100">

      {/* Noise texture */}
      <div
        aria-hidden
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '256px 256px',
        }}
      />

      {/* ── Nav ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#0A0A0F]/95 backdrop-blur-lg border-b border-white/5">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <Logo size={36} />
          <nav className="flex items-center gap-3">
            <Link
              href="/buddy"
              className="hidden sm:inline px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Discover experiences
            </Link>
            <Link
              href="/sign-in"
              className="hidden sm:inline px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="px-5 py-2.5 bg-white text-neutral-900 text-sm font-semibold rounded-full hover:bg-neutral-100 transition-all shadow-md hover:shadow-lg"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-20 sm:py-36 px-5 sm:px-8">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[700px] w-[700px] rounded-full bg-blue-500/[0.04] blur-[120px]" />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute top-20 right-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/[0.03] blur-[100px]"
        />

        <div className="relative max-w-5xl mx-auto text-center">
          <p className="animate-fade-up text-xs font-semibold tracking-[0.2em] text-neutral-400 uppercase mb-8">
            SweatBuddies
          </p>

          <h1 className="animate-fade-up-delay-1 text-5xl sm:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
            Sweat is better
            <span className="block text-neutral-400">shared.</span>
          </h1>

          <p className="animate-fade-up-delay-2 text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Sunrise yoga. Beach bootcamps. Run clubs. Cold plunge socials. Discover fitness and wellness experiences — and the people who make them unforgettable.
          </p>

          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/buddy"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-full hover:bg-neutral-100 transition-all shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 hover:scale-[1.02]"
            >
              Discover experiences
            </Link>
            <Link
              href="/communities/create"
              className="px-8 py-4 bg-white/5 text-neutral-100 text-base font-semibold rounded-full hover:bg-white/10 transition-all border border-white/10 backdrop-blur-sm"
            >
              Start something
            </Link>
          </div>
        </div>

        {/* Hero photo grid */}
        <div className="mt-20 max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { src: '/images/community-bonds.jpg', alt: 'Pickleball crew' },
              { src: '/banner/running.jpg', alt: 'Run club' },
              { src: '/banner/athletics.jpg', alt: 'Beach fitness' },
            ].map((img) => (
              <div key={img.src} className="group h-40 sm:h-56 rounded-2xl overflow-hidden shadow-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-neutral-500 mt-4 tracking-wide">Real communities. Real people. Moving together.</p>
        </div>

        {/* Photo strip */}
        <div className="mt-10 max-w-4xl mx-auto relative">
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {[
              { src: '/images/hero-2.jpg', alt: 'Yoga in the park' },
              { src: '/images/hero-3.jpg', alt: 'Cold plunge crew' },
              { src: '/banner/run-club.jpg', alt: 'Running together' },
              { src: '/banner/ice-bath.webp', alt: 'Ice bath session' },
            ].map((img) => (
              <div key={img.src} className="group flex-shrink-0 w-44 h-28 sm:w-52 sm:h-32 rounded-xl overflow-hidden shadow-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category browsing ────────────────────────────── */}
      <section className="px-5 sm:px-8 pb-20 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-5xl font-bold">
                What makes you sweat?
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              {CATEGORY_CARDS.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/communities?category=${cat.slug}`}
                  className="group bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.07] hover:border-white/[0.12] rounded-2xl p-6 transition-all text-center hover:shadow-lg hover:shadow-white/[0.02] hover:-translate-y-0.5"
                >
                  <span className="text-3xl sm:text-4xl block mb-3">{cat.emoji}</span>
                  <span className="text-sm font-semibold text-neutral-100 group-hover:text-white transition-colors">
                    {cat.label}
                  </span>
                  <span className="block text-xs text-neutral-400 mt-1.5 leading-relaxed">
                    {cat.vibe}
                  </span>
                </Link>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Featured communities ─────────────────────────── */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 border-b border-white/5">
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            {featuredCommunities.length > 0 ? (
              <>
                <div className="text-center mb-14">
                  <h2 className="text-3xl sm:text-5xl font-bold">
                    Who&apos;s hosting
                  </h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {featuredCommunities.map((community) => (
                    <Link
                      key={community.id}
                      href={`/communities/${community.slug}`}
                      className="group bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:shadow-white/[0.03] hover:-translate-y-1"
                    >
                      {/* Cover */}
                      <div className="relative h-44 sm:h-52 overflow-hidden">
                        {community.coverImage || CATEGORY_COVER_FALLBACKS[community.category] ? (
                          <Image
                            src={community.coverImage || CATEGORY_COVER_FALLBACKS[community.category] || '/banner/running.jpg'}
                            alt={community.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-5xl">
                            {categoryEmoji[community.category] ?? '🏅'}
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0F]/60 to-transparent" />
                        {/* Category badge */}
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs font-medium text-neutral-200 capitalize">
                            {categoryEmoji[community.category] ?? '🏅'}{' '}
                            {community.category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start gap-3">
                          {/* Logo overlapping cover */}
                          {community.logoImage && (
                            <div className="w-12 h-12 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0 -mt-10 border-2 border-[#0A0A0F] shadow-lg ring-1 ring-white/10">
                              <Image
                                src={community.logoImage}
                                alt={community.name}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-neutral-100 group-hover:text-white transition-colors truncate">
                              {community.name}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-neutral-500 mt-1.5">
                              <span className="font-medium">
                                {community.memberCount}{' '}
                                {community.memberCount === 1 ? 'member' : 'members'}
                              </span>
                              {community.city && <span>&middot; {community.city.name}</span>}
                            </div>
                          </div>
                        </div>
                        {community.description && (
                          <p className="mt-3 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {community.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center">
                <h2 className="text-3xl sm:text-5xl font-bold mb-4">
                  Your crew is forming.
                </h2>
                <p className="text-neutral-400 text-lg mb-10 max-w-lg mx-auto">
                  The best communities started with one person who said &apos;who&apos;s in?&apos;
                </p>
                <Link
                  href="/communities/create"
                  className="inline-block px-8 py-4 bg-white/5 text-neutral-200 text-sm font-semibold rounded-full hover:bg-white/10 transition-all border border-white/10"
                >
                  Start something &rarr;
                </Link>
              </div>
          )}
          </FadeInSection>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold mb-6">
                The right crew changes everything.
              </h2>
              <p className="text-neutral-400 text-lg max-w-xl mx-auto">No sign-up forms. No small talk. Just sweat, progress, and people who get it.</p>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  step: '01',
                  title: 'Discover',
                  body: 'Browse experiences by what moves you — running, yoga, strength, swimming, and more.',
                },
                {
                  step: '02',
                  title: 'Show up',
                  body: 'One tap. No commitment. Just you, showing up.',
                },
                {
                  step: '03',
                  title: 'Earn your spot',
                  body: 'Show up once, you\u2019re new. Show up twice, you\u2019re one of them. Show up every week, they save your spot.',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
                >
                  <p className="text-2xl font-bold text-neutral-500 mb-4">
                    {s.step}
                  </p>
                  <h3 className="text-xl font-semibold text-white mb-4">{s.title}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Community types ──────────────────────────────── */}
      <section className="py-20 sm:py-32 px-5 sm:px-8 border-b border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-5xl font-bold">
                Every sweat has a crew.
              </h2>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {[
                {
                  emoji: '🏃',
                  title: 'Sports & Movement',
                  body: 'The runners who turned your pace into a PR. The tennis crew that sharpened your serve. The swimmers who made 6am feel worth it.',
                },
                {
                  emoji: '🏋️',
                  title: 'Fitness & Training',
                  body: 'The bootcamp that broke you in the best way. The gym crew who made leg day non-negotiable. The HIIT squad where \u2018one more rep\u2019 is a love language.',
                },
                {
                  emoji: '🧘',
                  title: 'Wellness & Recovery',
                  body: 'The yoga circle where silence says everything. The cold plunge crew that proved you\u2019re tougher than you think. The pilates group that fixed what sitting broke.',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
                >
                  <div className="text-5xl mb-6">{item.emoji}</div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {item.title}
                  </h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Social proof ─────────────────────────────────── */}
      {showStats && (
        <section className="py-16 sm:py-24 px-5 sm:px-8 border-b border-white/5">
          <div className="max-w-4xl mx-auto">
            <FadeInSection>
              <div className="grid grid-cols-3 gap-8 text-center">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{communityCount}</p>
                  <p className="text-xs sm:text-sm text-neutral-500">communities</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{memberCount.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-neutral-500">members</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white mb-1">{sessionsThisWeek}</p>
                  <p className="text-xs sm:text-sm text-neutral-500">experiences this week</p>
                </div>
              </div>
            </FadeInSection>
          </div>
        </section>
      )}

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="py-28 sm:py-36 px-5 sm:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <FadeInSection>
            <h2 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">
              You already know you&apos;re better with the right people.
            </h2>
            <p className="text-neutral-400 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
              Every 5am alarm answered. Every PR earned. Every &apos;same time next week?&apos; That&apos;s what the right crew does.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link
                href="/buddy"
                className="px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-full hover:bg-neutral-100 transition-all shadow-xl hover:shadow-2xl hover:scale-[1.02]"
              >
                Discover experiences
              </Link>
              <Link
                href="/communities/create"
                className="px-10 py-4 bg-white/5 text-neutral-200 text-lg font-semibold rounded-full border border-white/10 hover:bg-white/10 transition-all"
              >
                Start something
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-12 sm:py-16 px-5 sm:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Logo size={24} />
                <span className="font-semibold text-neutral-200">SweatBuddies</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed max-w-xs">Discover fitness and wellness experiences. The right crew changes everything.</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Product</p>
              <ul className="space-y-3">
                <li><Link href="/buddy" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Discover experiences</Link></li>
                <li><Link href="/communities" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Communities</Link></li>
                <li><Link href="/communities/create" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Start something</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">Support</p>
              <ul className="space-y-3">
                <li><a href={`mailto:${SUPPORT_EMAIL}`} className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Contact</a></li>
                <li><Link href="/support" className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors">Help &amp; FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-600">&copy; 2026 SweatBuddies. All rights reserved.</p>
            <p className="text-xs text-neutral-600">Sweat is better shared.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
