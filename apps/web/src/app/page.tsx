import Link from 'next/link'
import { Metadata } from 'next'
import { Logo } from '@/components/logo'
import { prisma } from '@/lib/prisma'
import { SUPPORT_EMAIL } from '@/config/constants'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'SweatBuddies — Find Verified Fitness & Sports Coaches Near You',
  description:
    'Find and book verified personal trainers, sports coaches, yoga instructors, and wellness professionals near you. Group sessions from $15, private training from $60.',
}

const GOAL_CARDS = [
  { emoji: '\u{1F3CA}', label: 'Learn to swim', slug: 'learn-to-swim' },
  { emoji: '\u{1F3CB}\uFE0F', label: 'Get stronger', slug: 'get-stronger' },
  { emoji: '\u{1F3C3}', label: 'Run faster', slug: 'run-faster' },
  { emoji: '\u{1F3BE}', label: 'Play tennis', slug: 'play-tennis' },
  { emoji: '\u{1F4AA}', label: 'Lose weight', slug: 'lose-weight' },
  { emoji: '\u{1F9D8}', label: 'Move better', slug: 'move-better' },
  { emoji: '\u{1F3F8}', label: 'Play badminton', slug: 'play-badminton' },
  { emoji: '\u{1F938}', label: 'Gymnastics', slug: 'gymnastics' },
  { emoji: '\u{1FA7A}', label: 'Recover from injury', slug: 'recover-from-injury' },
]

export default async function HomePage() {
  const featuredCoaches = await prisma.coachProfile.findMany({
    where: {
      isActive: true,
      user: {
        isCoach: true,
        coachVerificationStatus: 'VERIFIED',
      },
    },
    take: 3,
    orderBy: { averageRating: 'desc' },
    include: {
      user: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  })

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">

      {/* -- Nav ------------------------------------------------ */}
      <header className="sticky top-0 z-30 bg-neutral-950/90 backdrop-blur border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo size={28} />
          <nav className="flex items-center gap-2">
            <Link
              href="/browse"
              className="hidden sm:inline px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              Browse coaches
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
            Find a coach.
            <span className="block text-neutral-400">Get better, faster.</span>
          </h1>

          <p className="text-lg sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Verified fitness, sports, and wellness coaches near you — from group sessions to 1-on-1 training.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="px-8 py-4 bg-white text-neutral-900 text-base font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-lg"
            >
              Find a coach &rarr;
            </Link>
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-neutral-800 text-neutral-100 text-base font-semibold rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
            >
              I&apos;m a coach
            </Link>
          </div>
        </div>
      </section>

      {/* -- Goal-based discovery ------------------------------- */}
      <section className="px-4 sm:px-6 pb-16 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">What do you want to achieve?</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {GOAL_CARDS.map((goal) => (
              <Link
                key={goal.slug}
                href={`/browse?goal=${goal.slug}`}
                className="group bg-neutral-900 border border-neutral-800 hover:border-neutral-600 rounded-2xl p-5 transition-all text-center"
              >
                <span className="text-3xl block mb-2">{goal.emoji}</span>
                <span className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {goal.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* -- How it works -------------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Three steps. No friction.</h2>
            <p className="text-neutral-400">Find, book, improve.</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Find the right coach',
                body: 'Browse verified coaches by sport, goal, or location. See their credentials, ratings, and prices upfront.',
              },
              {
                step: '02',
                title: 'Book a session',
                body: 'Group sessions from $15. Private sessions from $60. One tap to book \u2014 no awkward negotiations.',
              },
              {
                step: '03',
                title: 'Get better, faster',
                body: 'Professional coaching accelerates your progress. Whether it\u2019s your first lesson or your hundredth.',
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

      {/* -- Coach categories ---------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Every kind of coach</h2>
            <p className="text-neutral-400">Personal trainers, sports coaches, yoga instructors, and more</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                emoji: '\u{1F3C3}',
                title: 'Sports Coaches',
                body: 'Tennis, swimming, badminton, football. Learn a sport or sharpen your game.',
              },
              {
                emoji: '\u{1F3CB}\uFE0F',
                title: 'Personal Trainers',
                body: 'Strength, HIIT, weight loss, body recomposition. All levels, all goals.',
              },
              {
                emoji: '\u{1F9D8}',
                title: 'Wellness & Recovery',
                body: 'Yoga, pilates, physiotherapy, meditation. Move better, feel better.',
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

      {/* -- Trust signals ------------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">Every coach is verified</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: '\u2713',
                title: 'Credentials checked',
                body: 'Certifications verified by our team',
              },
              {
                icon: '\u2B50',
                title: 'Real reviews',
                body: 'Ratings from verified students only',
              },
              {
                icon: '\u{1F512}',
                title: 'Secure payments',
                body: 'Pay through the platform. Money-back guarantee.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-7 text-center">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="text-base font-semibold text-neutral-100 mb-2">{item.title}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -- Featured coaches ---------------------------------- */}
      <section className="py-14 sm:py-28 px-4 sm:px-6 border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto">
          {featuredCoaches.length > 0 ? (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-3">Top-rated coaches</h2>
              </div>
              <div className="grid sm:grid-cols-3 gap-6">
                {featuredCoaches.map((coach) => (
                  <div
                    key={coach.id}
                    className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center"
                  >
                    {coach.user.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coach.user.imageUrl}
                        alt={coach.displayName}
                        className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-neutral-800 flex items-center justify-center text-neutral-500 text-xl font-bold">
                        {coach.displayName.charAt(0)}
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-neutral-100 mb-1">
                      {coach.displayName}
                    </h3>
                    {coach.tagline && (
                      <p className="text-xs text-neutral-500 mb-3">{coach.tagline}</p>
                    )}
                    <div className="flex items-center justify-center gap-3 text-sm text-neutral-400">
                      {coach.averageRating > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="text-yellow-500">{'\u2B50'}</span>
                          {coach.averageRating.toFixed(1)}
                        </span>
                      )}
                      {coach.sessionPrice != null && (
                        <span>From ${Math.round(coach.sessionPrice / 100)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">Coaches joining soon</h2>
              <p className="text-neutral-400 mb-8">
                We&apos;re onboarding verified coaches. Be one of the first.
              </p>
              <Link
                href="/sign-up"
                className="inline-block px-6 py-3 bg-neutral-800 text-neutral-300 text-sm font-medium rounded-xl hover:bg-neutral-700 transition-colors border border-neutral-700"
              >
                Apply to coach &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* -- Final CTA ----------------------------------------- */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
            Professional coaching, accessible to everyone.
          </h2>
          <p className="text-neutral-400 text-lg mb-10">
            From $15 group sessions to premium 1-on-1 training.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/browse"
              className="inline-block px-10 py-4 bg-white text-neutral-900 text-lg font-semibold rounded-xl hover:bg-neutral-100 transition-colors shadow-xl"
            >
              Find a coach
            </Link>
            <Link
              href="/sign-up"
              className="inline-block px-10 py-4 bg-transparent text-neutral-300 text-lg font-semibold rounded-xl border border-neutral-700 hover:border-neutral-500 transition-colors"
            >
              Apply as a coach
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
            <Link href="/browse" className="hover:text-neutral-300 transition-colors py-3 -my-3">Browse coaches</Link>
            <Link href="/sign-up" className="hover:text-neutral-300 transition-colors py-3 -my-3">Become a coach</Link>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-neutral-300 transition-colors py-3 -my-3">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
