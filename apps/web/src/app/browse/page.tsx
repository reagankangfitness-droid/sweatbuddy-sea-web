import { prisma } from '@/lib/prisma'
import { SessionCard } from '@/components/SessionCard'
import { ActivityBadge } from '@/components/ui/ActivityBadge'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import type { Metadata } from 'next'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

export const metadata: Metadata = {
  title: 'Browse Sessions — SweatBuddies',
  description: 'Find free P2P workout sessions near you in Singapore. Running, gym, yoga and more.',
}

const TYPES = [
  { value: '', label: 'All', emoji: '✨', isNew: false },
  ...ACTIVITY_TYPES.map((t) => ({ value: t.key, label: t.label, emoji: t.emoji, isNew: t.isNew ?? false })),
]

interface PageProps {
  searchParams: Promise<{ type?: string }>
}

export default async function BrowsePage({ searchParams }: PageProps) {
  const { type } = await searchParams

  const sessions = await prisma.activity.findMany({
    where: {
      activityMode: { in: ['P2P_FREE', 'P2P_PAID'] },
      status: 'PUBLISHED',
      deletedAt: null,
      startTime: { gte: new Date() },
      ...(type && type !== '' && { categorySlug: type }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          slug: true,
          sessionsHostedCount: true,
        },
      },
      userActivities: {
        where: { status: { in: ['JOINED', 'COMPLETED'] } },
        include: {
          user: {
            select: { id: true, name: true, imageUrl: true },
          },
        },
      },
    },
    orderBy: { startTime: 'asc' },
    take: 24,
  })

  const mapped = sessions.map((a) => ({
    id: a.id,
    title: a.title,
    categorySlug: a.categorySlug,
    activityMode: a.activityMode,
    startTime: a.startTime?.toISOString() ?? null,
    address: a.address,
    city: a.city,
    price: a.price,
    maxPeople: a.maxPeople,
    fitnessLevel: a.fitnessLevel,
    requiresApproval: a.requiresApproval,
    imageUrl: a.imageUrl,
    host: {
      id: a.user.id,
      name: a.user.name,
      imageUrl: a.user.imageUrl,
      slug: a.user.slug,
      sessionsHostedCount: a.user.sessionsHostedCount,
    },
    attendees: a.userActivities.map((ua) => ({
      id: ua.user.id,
      name: ua.user.name,
      imageUrl: ua.user.imageUrl,
    })),
    attendeeCount: a.userActivities.length,
    isFull: a.maxPeople ? a.userActivities.length >= a.maxPeople : false,
    userStatus: null as string | null,
  }))

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo size={28} />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-2 bg-white text-neutral-900 text-sm font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero strip */}
      <div className="border-b border-neutral-800 bg-neutral-900/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Browse Sessions</h1>
          <p className="text-neutral-400">
            Free P2P workout sessions in Singapore — no login needed to browse.
          </p>
        </div>
      </div>

      {/* Type filters */}
      <div className="border-b border-neutral-800 sticky top-[65px] z-20 bg-neutral-950/95 backdrop-blur">
        <div className="relative max-w-6xl mx-auto">
          <div className="px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
            {TYPES.map((t) => {
              const active = (type ?? '') === t.value
              return (
                <Link
                  key={t.value}
                  href={t.value ? `/browse?type=${t.value}` : '/browse'}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
                    active
                      ? 'bg-white text-neutral-900 border-white'
                      : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200'
                  }`}
                >
                  <span>{t.emoji}</span>
                  {t.label}
                  {t.isNew && !active && (
                    <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 leading-none">
                      NEW
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
          <div className="sm:hidden pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-950 to-transparent" />
        </div>
      </div>

      {/* Session grid */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {mapped.length === 0 ? (
          <div className="flex flex-col items-center text-center py-20">
            <div className="text-5xl mb-4 opacity-40">🏋️</div>
            <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
            <p className="text-sm text-neutral-500 mb-6">
              Be the first to host a session in this category.
            </p>
            <Link
              href="/sign-up"
              className="px-6 py-2.5 bg-white text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-100 transition-colors"
            >
              Sign up to host
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-500 mb-6">
              {mapped.length} upcoming session{mapped.length !== 1 ? 's' : ''}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {mapped.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  guestSignUpHref={`/sign-up?redirect=/activities/${session.id}`}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer CTA */}
      <div className="border-t border-neutral-800 bg-neutral-900/40 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 text-center">
          <h2 className="text-2xl font-bold mb-3">Want to host or join sessions?</h2>
          <p className="text-neutral-400 mb-6">It&apos;s free. Takes 2 minutes.</p>
          <Link
            href="/sign-up"
            className="inline-block px-8 py-3.5 bg-white text-neutral-900 font-semibold rounded-xl hover:bg-neutral-100 transition-colors"
          >
            Create free account
          </Link>
        </div>
      </div>
    </div>
  )
}
