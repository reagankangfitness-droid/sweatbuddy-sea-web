import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100">

      {/* -- Nav ------------------------------------------------ */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo size={28} />
          <nav className="flex items-center gap-2">
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
              className="px-4 py-3 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Join
            </Link>
          </nav>
        </div>
      </header>

      {/* -- Hero ----------------------------------------------- */}
      <section className="relative overflow-hidden py-14 sm:py-32 px-4 sm:px-6">
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

          <h1 className="text-4xl sm:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            Sweat is better
            <span className="block text-neutral-400">shared.</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Sunrise yoga. Beach bootcamps. Run clubs. Cold plunge socials. Discover fitness and wellness experiences — and the people who make them unforgettable.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/buddy"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              Discover experiences
            </Link>
            <Link
              href="/communities/create"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Start something
            </Link>
          </div>
        </div>

        {/* Hero photo grid */}
        <div className="mt-16 max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { src: '/images/community-bonds.jpg', alt: 'Pickleball crew' },
              { src: '/banner/running.jpg', alt: 'Run club' },
              { src: '/banner/athletics.jpg', alt: 'Beach fitness' },
            ].map((img) => (
              <div key={img.src} className="h-36 sm:h-48 rounded-2xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-neutral-600 mt-3">Real communities. Real people. Moving together.</p>
        </div>

        {/* Community photo strip */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
            {[
              { src: '/images/hero-2.jpg', alt: 'Yoga in the park' },
              { src: '/images/hero-3.jpg', alt: 'Cold plunge crew' },
              { src: '/banner/run-club.jpg', alt: 'Running together' },
              { src: '/banner/ice-bath.webp', alt: 'Ice bath session' },
            ].map((img) => (
              <div key={img.src} className="flex-shrink-0 w-44 h-28 sm:w-52 sm:h-32 rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt={img.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Category browsing --------------------------------- */}
      <section className="px-4 sm:px-6 pb-16 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              What makes you sweat?
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORY_CARDS.map((cat) => (
              <Link
                key={cat.slug}
                href={`/communities?category=${cat.slug}`}
                className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-5 transition-all text-center"
              >
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                <span className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {cat.label}
                </span>
                <span className="block text-xs text-neutral-500 mt-1">
                  {cat.vibe}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -- Featured communities ------------------------------ */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          {featuredCommunities.length > 0 ? (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                  Who&apos;s hosting
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCommunities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl overflow-hidden transition-all"
                  >
                    {/* Cover */}
                    <div className="relative h-36">
                      {community.coverImage || CATEGORY_COVER_FALLBACKS[community.category] ? (
                        <Image
                          src={community.coverImage || CATEGORY_COVER_FALLBACKS[community.category] || '/banner/running.jpg'}
                          alt={community.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-4xl">
                          {categoryEmoji[community.category] ?? '🏅'}
                        </div>
                      )}
                      {/* Category badge on cover */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-neutral-950/80 backdrop-blur-sm rounded-full text-xs font-medium text-neutral-300 capitalize">
                          {categoryEmoji[community.category] ?? '🏅'}{' '}
                          {community.category.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        {/* Community logo overlapping cover */}
                        {community.logoImage && (
                          <div className="w-10 h-10 rounded-full bg-neutral-800 overflow-hidden flex-shrink-0 -mt-8 border-2 border-neutral-700 shadow-sm">
                            <Image
                              src={community.logoImage}
                              alt={community.name}
                              width={40}
                              height={40}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-neutral-100 group-hover:text-white transition-colors truncate">
                            {community.name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-neutral-400 mt-1">
                            <span>
                              {community.memberCount}{' '}
                              {community.memberCount === 1 ? 'member' : 'members'}
                            </span>
                            {community.city && <span>{community.city.name}</span>}
                          </div>
                        </div>
                      </div>
                      {/* Description preview */}
                      {community.description && (
                        <p className="mt-2 text-xs text-neutral-500 line-clamp-1">
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
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Your crew is forming.
              </h2>
              <p className="text-neutral-400 mb-8">
                The best communities started with one person who said &apos;who&apos;s in?&apos;
              </p>
              <Link
                href="/communities/create"
                className="inline-block px-6 py-3 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
              >
                Start something &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* -- How it works -------------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              The right crew changes everything.
            </h2>
            <p className="text-neutral-400">No sign-up forms. No small talk. Just sweat, progress, and people who get it.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
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
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <p className="text-xs font-bold text-neutral-600 tracking-widest mb-4">
                  {s.step}
                </p>
                <h3 className="text-lg font-semibold mb-3">{s.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Community types ----------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Every sweat has a crew.
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
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
                className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7"
              >
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-base font-semibold text-neutral-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Trust / social proof ------------------------------ */}
      {showStats && (
        <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-neutral-400">
              {communityCount} communities &middot; {memberCount} members
              &middot; {sessionsThisWeek} sessions this week
            </p>
          </div>
        </section>
      )}

      {/* -- Final CTA ----------------------------------------- */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            You already know you&apos;re better with the right people.
          </h2>
          <p className="text-neutral-400 text-lg mb-10">
            Every 5am alarm answered. Every PR earned. Every &apos;same time next week?&apos; That&apos;s what the right crew does.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/buddy"
              className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
            >
              Discover experiences
            </Link>
            <Link
              href="/communities/create"
              className="inline-block px-10 py-4 bg-transparent text-neutral-300 text-lg font-semibold rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors"
            >
              Start something
            </Link>
          </div>
        </div>
      </section>

      {/* -- Footer -------------------------------------------- */}
      <footer className="border-t border-neutral-800 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <Logo size={20} />
            <span>&copy; 2026 SweatBuddies</span>
          </div>
          <div className="flex gap-3 sm:gap-6">
            <Link
              href="/buddy"
              className="hover:text-neutral-300 transition-colors py-3 -my-3"
            >
              Discover experiences
            </Link>
            <Link
              href="/communities/create"
              className="hover:text-neutral-300 transition-colors py-3 -my-3"
            >
              Start something
            </Link>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="hover:text-neutral-300 transition-colors py-3 -my-3"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
