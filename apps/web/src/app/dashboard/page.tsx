'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  Heart,
  Users,
  ChevronRight,
  Plus,
  DollarSign,
  Loader2,
} from 'lucide-react'
import { UpcomingEventRow } from '@/components/host/UpcomingEventRow'
import { PastEventRow } from '@/components/host/PastEventRow'

interface AttendingEvent {
  id: string
  eventId: string
  eventName: string
  timestamp: string
  category?: string
  day?: string
  time?: string
  location?: string
  imageUrl?: string | null
  eventDate?: string | null
}

interface HostingEvent {
  id: string
  name: string
  day: string
  date: string | null
  time: string
  location: string
  imageUrl: string | null
  category: string
  recurring: boolean
  goingCount: number
  organizer: string
}

interface DashboardData {
  attending: {
    events: AttendingEvent[]
    count: number
  }
  hosting: {
    events: HostingEvent[]
    pastEvents: HostingEvent[]
    stats: {
      activeEvents: number
      totalSignups: number
      totalEarnings: number
      paidAttendees: number
    }
  }
  isHost: boolean
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)

  // Read saved count from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
    setSavedCount(saved.length)

    // Listen for changes
    const handleUpdate = () => {
      const ids = JSON.parse(localStorage.getItem('sweatbuddies_saved') || '[]')
      setSavedCount(ids.length)
    }
    window.addEventListener('savedEventsUpdated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('savedEventsUpdated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect_url=/dashboard')
      return
    }

    if (isSignedIn) {
      fetch('/api/dashboard')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch dashboard data')
          return res.json()
        })
        .then((data) => {
          setData(data)
          setIsLoading(false)
        })
        .catch((err) => {
          console.error('Dashboard error:', err)
          setError(err.message)
          setIsLoading(false)
        })
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Dashboard</h1>
          </div>
        </header>
        <main className="pt-24 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
            <Link
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">Dashboard</h1>
          </div>
        </header>
        <main className="pt-24 px-4 text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg"
          >
            Try Again
          </button>
        </main>
      </div>
    )
  }

  const email = user?.primaryEmailAddress?.emailAddress

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 h-14 sm:h-16 flex items-center gap-4">
          <Link
            href="/"
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700 dark:text-neutral-300" />
          </Link>
          <h1 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white">Dashboard</h1>
        </div>
      </header>

      {/* Content */}
      <main className="pt-20 sm:pt-24 pb-20 sm:pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xl font-semibold">
                    {user?.firstName?.[0] || email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {user?.fullName || user?.firstName || 'SweatBuddy'}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{email}</p>
              </div>
            </div>
          </div>

          {/* Create New Event Button - only for hosts */}
          {data?.isHost && (
            <Link
              href="/host"
              className="flex items-center justify-center gap-2 w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-2xl hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New Event
            </Link>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 text-center">
              <Calendar className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                {data?.attending.count || 0}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">Events Joined</p>
            </div>
            {data?.isHost ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 text-center">
                <Users className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {data.hosting.stats.activeEvents}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Events Hosting</p>
              </div>
            ) : (
              <Link
                href="/saved"
                className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 text-center hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                <Heart className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{savedCount}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Saved</p>
              </Link>
            )}
          </div>

          {/* Start Hosting CTA - for non-hosts */}
          {!data?.isHost && (
            <div className="bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 rounded-2xl border border-purple-100 dark:border-purple-800 p-4 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xl sm:text-2xl">✨</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 text-sm sm:text-base">
                    Become a Host
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    Lead your own fitness events and build your community
                  </p>
                  <Link
                    href="/host"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
                  >
                    Learn More
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Host Stats (only if host with earnings) */}
          {data?.isHost && data.hosting.stats.totalEarnings > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                    ${(data.hosting.stats.totalEarnings / 100).toFixed(2)} SGD
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    Earned from {data.hosting.stats.paidAttendees} paid attendees
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Events I'm Attending */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-blue-200 dark:border-blue-800 overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">Events I'm Attending</h3>
              </div>
            </div>

            {!data?.attending.events.length ? (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">🏃</span>
                </div>
                <h4 className="font-medium text-neutral-900 dark:text-white mb-1 text-sm sm:text-base">No upcoming events</h4>
                <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mb-4">Find your next workout buddy!</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
                >
                  Explore Events
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {data.attending.events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/e/${event.eventId}`}
                    className="flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {event.imageUrl ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                          <Image
                            src={event.imageUrl}
                            alt={event.eventName}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white line-clamp-1">
                          {event.eventName}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {event.eventDate
                            ? new Date(event.eventDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })
                            : event.day}{' '}
                          · {event.time}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Events I'm Hosting (only if host) */}
          {data?.isHost && (
            <>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-purple-200 dark:border-purple-800 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-purple-100 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm sm:text-base">Events I'm Hosting</h3>
                  </div>
                  <span className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 font-medium">
                    {data.hosting.stats.totalSignups} signups
                  </span>
                </div>

                {!data.hosting.events.length ? (
                  <div className="p-6 sm:p-8 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl sm:text-3xl">🎯</span>
                    </div>
                    <h4 className="font-medium text-neutral-900 dark:text-white mb-1 text-sm sm:text-base">No upcoming events</h4>
                    <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mb-4">Create your first event!</p>
                    <Link
                      href="/host"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs sm:text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
                    >
                      Create Event
                      <Plus className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.hosting.events.map((event) => (
                      <UpcomingEventRow key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>

              {/* Past Hosted Events */}
              {data.hosting.pastEvents.length > 0 && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h3 className="font-semibold text-neutral-900 dark:text-white">Past Events</h3>
                  </div>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {data.hosting.pastEvents.map((event) => (
                      <PastEventRow key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </main>
    </div>
  )
}
