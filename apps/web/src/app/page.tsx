import Link from 'next/link'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { prisma } from '@/lib/prisma'
import { ACTIVITY_TYPES } from '@/lib/activity-types'
import { SUPPORT_EMAIL } from '@/config/constants'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Discover Fitness Communities Near You',
  description:
    'Find and join run clubs, yoga groups, swimming squads, tennis crews, and more. Real communities, real people, near you.',
}

const CATEGORY_CARDS = [
  { emoji: '🏃', label: 'Running Clubs', slug: 'running' },
  { emoji: '🧘', label: 'Yoga Groups', slug: 'yoga' },
  { emoji: '🏊', label: 'Swimming Squads', slug: 'swimming' },
  { emoji: '🎾', label: 'Tennis Crews', slug: 'padel' },
  { emoji: '🏋️', label: 'Gym & Strength', slug: 'gym' },
  { emoji: '🏸', label: 'Badminton Groups', slug: 'badminton' },
  { emoji: '🥾', label: 'Hiking Crews', slug: 'hiking' },
  { emoji: '⚡', label: 'HIIT & Bootcamp', slug: 'bootcamp' },
  { emoji: '🧊', label: 'Cold Plunge', slug: 'cold_plunge' },
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
              href="/communities"
              className="hidden sm:inline px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Browse communities
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
            Discover fitness communities
            <span className="block text-neutral-400">near you.</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Run clubs, yoga groups, swimming squads, tennis crews — find your
            people and start moving together.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/communities"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              Browse communities &rarr;
            </Link>
            <Link
              href="/host/community"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              Start a community
            </Link>
          </div>
        </div>
      </section>

      {/* -- Category browsing --------------------------------- */}
      <section className="px-4 sm:px-6 pb-16 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Find your kind of community
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
                  Featured communities
                </h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredCommunities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.slug}`}
                    className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl overflow-hidden transition-all"
                  >
                    {community.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={community.coverImage}
                        alt={community.name}
                        className="w-full h-36 object-cover"
                      />
                    ) : (
                      <div className="w-full h-36 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-4xl">
                        {categoryEmoji[community.category] ?? '🏅'}
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {categoryEmoji[community.category] ?? '🏅'}
                        </span>
                        <h3 className="text-base font-semibold text-neutral-100 group-hover:text-white transition-colors truncate">
                          {community.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-neutral-400 mt-2">
                        <span>
                          {community.memberCount}{' '}
                          {community.memberCount === 1 ? 'member' : 'members'}
                        </span>
                        {community.city && <span>{community.city.name}</span>}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                Communities launching soon
              </h2>
              <p className="text-neutral-400 mb-8">
                Be the first to start a community in your area.
              </p>
              <Link
                href="/host/community"
                className="inline-block px-6 py-3 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
              >
                Start the first one &rarr;
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
              Three steps. Zero friction.
            </h2>
            <p className="text-neutral-400">Discover, join, show up.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Find your community',
                body: 'Browse run clubs, yoga groups, tennis crews, and more. Filter by activity, location, or vibe.',
              },
              {
                step: '02',
                title: 'Join with one tap',
                body: 'No forms. No commitments. Join a community and see what\u2019s happening this week.',
              },
              {
                step: '03',
                title: 'Show up and belong',
                body: 'Attend your first session. By the end, you\u2019ll know someone\u2019s name. That\u2019s how regulars get made.',
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
              Every kind of community
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: '🏃',
                title: 'Sports & Movement',
                body: 'Run clubs, tennis groups, swimming squads, badminton crews. Find your sport.',
              },
              {
                emoji: '🏋️',
                title: 'Fitness & Training',
                body: 'Gym groups, HIIT bootcamps, CrossFit boxes, calisthenics crews. Push together.',
              },
              {
                emoji: '🧘',
                title: 'Wellness & Recovery',
                body: 'Yoga circles, pilates groups, cold plunge crews, meditation communities. Feel better.',
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
            Your community is already out there.
          </h2>
          <p className="text-neutral-400 text-lg mb-10">
            They meet every week. They just need a place to find each other.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/communities"
              className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
            >
              Browse communities
            </Link>
            <Link
              href="/host/community"
              className="inline-block px-10 py-4 bg-transparent text-neutral-300 text-lg font-semibold rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors"
            >
              Start a community
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
              href="/communities"
              className="hover:text-neutral-300 transition-colors py-3 -my-3"
            >
              Browse communities
            </Link>
            <Link
              href="/host/community"
              className="hover:text-neutral-300 transition-colors py-3 -my-3"
            >
              Start a community
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
