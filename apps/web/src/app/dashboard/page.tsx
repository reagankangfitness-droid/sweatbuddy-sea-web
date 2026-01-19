'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Loader2,
  Users,
  Sparkles,
  LayoutDashboard,
  Search,
} from 'lucide-react'

interface EventData {
  id: string
  name: string
  category: string
  day: string
  time: string
  location: string
  imageUrl: string | null
  date: string | null
  recurring: boolean
  organizer: string
  slug: string | null
  goingCount?: number
}

interface DashboardData {
  nextEvent: EventData | null
  upcomingEvents: EventData[]
  upcomingCount: number
  discover: EventData[]
  isHost: boolean
  userName: string
}

function getTimeUntil(dateStr: string): string {
  const eventDate = new Date(dateStr)
  const now = new Date()
  const diffMs = eventDate.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays < 7) return `In ${diffDays} days`
  return eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatEventDate(dateStr: string | null, day: string): string {
  if (!dateStr) return day
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DashboardPage() {
  const { isLoaded, isSignedIn } = useUser()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Activity</h1>
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
        <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            </Link>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Activity</h1>
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

  const hasUpcomingEvents = data && data.upcomingCount > 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-4">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
          >
            <ArrowLeft className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Activity</h1>
        </div>
      </header>

      {/* Content */}
      <main className="pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Greeting */}
          <div className="pt-4">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Hey {data?.userName}! 👋
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
              {hasUpcomingEvents
                ? `You have ${data.upcomingCount} upcoming event${data.upcomingCount > 1 ? 's' : ''}`
                : "Let's find your next workout"}
            </p>
          </div>

          {/* Host Banner */}
          {data?.isHost && (
            <Link
              href="/host/dashboard"
              className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl text-white"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold">Host Dashboard</p>
                  <p className="text-sm text-purple-100">Manage your events</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-200" />
            </Link>
          )}

          {/* Next Event Spotlight */}
          {data?.nextEvent && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider px-1 mb-3">
                Next Up
              </h3>
              <Link
                href={data.nextEvent.slug ? `/event/${data.nextEvent.slug}` : `/e/${data.nextEvent.id}`}
                className="block bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
              >
                {/* Event Image */}
                <div className="relative h-40 bg-neutral-100 dark:bg-neutral-800">
                  {data.nextEvent.imageUrl ? (
                    <Image
                      src={data.nextEvent.imageUrl}
                      alt={data.nextEvent.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-600" />
                    </div>
                  )}
                  {/* Time Badge */}
                  {data.nextEvent.date && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-white dark:bg-neutral-900 rounded-full shadow-lg">
                      <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {getTimeUntil(data.nextEvent.date)}
                      </span>
                    </div>
                  )}
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-neutral-900/70 backdrop-blur-sm rounded-full">
                    <span className="text-xs font-medium text-white">{data.nextEvent.category}</span>
                  </div>
                </div>

                {/* Event Details */}
                <div className="p-4">
                  <h4 className="font-semibold text-lg text-neutral-900 dark:text-white mb-2">
                    {data.nextEvent.name}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {formatEventDate(data.nextEvent.date, data.nextEvent.day)} · {data.nextEvent.time}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {data.nextEvent.location.split(',')[0]}
                    </span>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Upcoming Events */}
          {hasUpcomingEvents && data.upcomingEvents.length > 1 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Upcoming Events
                </h3>
                <Link
                  href="/my-events"
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  See all
                </Link>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {data.upcomingEvents.slice(1).map((event, idx) => (
                  <Link
                    key={event.id}
                    href={event.slug ? `/event/${event.slug}` : `/e/${event.id}`}
                    className={`flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors ${
                      idx > 0 ? 'border-t border-neutral-100 dark:border-neutral-800' : ''
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-white truncate">
                        {event.name}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {formatEventDate(event.date, event.day)} · {event.time}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No Upcoming Events State */}
          {!hasUpcomingEvents && (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <h4 className="font-semibold text-neutral-900 dark:text-white mb-2">
                No upcoming events
              </h4>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-4">
                Find your next workout and join the crew!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-medium hover:bg-neutral-700 dark:hover:bg-neutral-100 transition-colors"
              >
                <Search className="w-4 h-4" />
                Find Events
              </Link>
            </div>
          )}

          {/* Discover Section */}
          {data?.discover && data.discover.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-1 mb-3">
                <h3 className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Discover This Week
                </h3>
                <Link
                  href="/"
                  className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  Browse all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {data.discover.slice(0, 4).map((event) => (
                  <Link
                    key={event.id}
                    href={event.slug ? `/event/${event.slug}` : `/e/${event.id}`}
                    className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                  >
                    <div className="relative h-24 bg-neutral-100 dark:bg-neutral-800">
                      {event.imageUrl ? (
                        <Image
                          src={event.imageUrl}
                          alt={event.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-neutral-300 dark:text-neutral-600" />
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-neutral-900/70 backdrop-blur-sm rounded-full">
                        <span className="text-[10px] font-medium text-white">{event.category}</span>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm text-neutral-900 dark:text-white line-clamp-1 mb-1">
                        {event.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {event.date ? formatEventDate(event.date, event.day) : event.day}
                      </p>
                      {event.goingCount !== undefined && event.goingCount > 0 && (
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {event.goingCount} going
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Search className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-medium text-sm text-neutral-900 dark:text-white">Find Events</span>
            </Link>
            <Link
              href="/my-events"
              className="flex items-center gap-3 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-medium text-sm text-neutral-900 dark:text-white">My Events</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
