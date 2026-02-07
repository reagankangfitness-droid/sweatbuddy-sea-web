'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Radio, MapPin, Clock, Users, MessageCircle, Loader2 } from 'lucide-react'
import { WAVE_ACTIVITIES } from '@/lib/wave/constants'
import type { WaveActivityType } from '@prisma/client'

interface MyActivity {
  id: string
  activityType: WaveActivityType
  area: string
  locationName: string | null
  thought: string | null
  participantCount: number
  waveThreshold: number
  isUnlocked: boolean
  chatId: string | null
  startedAt: string
  expiresAt: string
  scheduledFor: string | null
}

export default function MyActivitiesPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useUser()
  const [activities, setActivities] = useState<MyActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in?redirect=/my-activities')
      return
    }

    if (isSignedIn) {
      fetchMyActivities()
    }
  }, [isLoaded, isSignedIn, router])

  const fetchMyActivities = async () => {
    try {
      const res = await fetch('/api/wave/my-activities')
      if (!res.ok) throw new Error('Failed to fetch activities')
      const data = await res.json()
      setActivities(data.activities || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const activeActivities = activities.filter(a => new Date(a.expiresAt) > new Date())
  const expiredActivities = activities.filter(a => new Date(a.expiresAt) <= new Date())

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-neutral-50/95 dark:bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="flex items-center gap-4 px-4 py-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">My Activities</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Activities you&apos;ve started</p>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-24 px-4 max-w-lg mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">{error}</p>
            <button
              onClick={fetchMyActivities}
              className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-medium"
            >
              Try again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Radio className="w-8 h-8 text-cyan-500" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">No activities yet</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6 max-w-xs mx-auto">
              Start an activity on the map to find others who want to join you!
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full text-sm font-semibold"
            >
              <MapPin className="w-4 h-4" />
              Go to Map
            </Link>
          </div>
        ) : (
          <>
            {/* Active Activities */}
            {activeActivities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-3">
                  Active ({activeActivities.length})
                </h2>
                <div className="space-y-3">
                  {activeActivities.map((activity) => {
                    const activityInfo = WAVE_ACTIVITIES[activity.activityType]
                    const timeRemaining = getTimeRemaining(activity.expiresAt)

                    return (
                      <div
                        key={activity.id}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                            activity.isUnlocked
                              ? 'bg-emerald-100 dark:bg-emerald-900/30'
                              : 'bg-cyan-100 dark:bg-cyan-900/30'
                          }`}>
                            {activityInfo.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-neutral-900 dark:text-white">
                                {activityInfo.label}
                              </span>
                              {activity.isUnlocked && (
                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full">
                                  Unlocked
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                              {activity.locationName || activity.area}
                            </p>

                            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span className={activity.isUnlocked ? 'text-emerald-600 dark:text-emerald-400 font-medium' : ''}>
                                  {activity.participantCount}/{activity.waveThreshold} 🙋
                                </span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {timeRemaining}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                          <Link
                            href="/app"
                            className="flex-1 py-2 px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium text-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          >
                            View on Map
                          </Link>
                          {activity.isUnlocked && activity.chatId && (
                            <Link
                              href={`/app?chat=${activity.chatId}`}
                              className="flex-1 py-2 px-3 bg-emerald-500 text-white rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Crew Chat
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Expired Activities */}
            {expiredActivities.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-1 mb-3">
                  Past ({expiredActivities.length})
                </h2>
                <div className="space-y-3">
                  {expiredActivities.slice(0, 10).map((activity) => {
                    const activityInfo = WAVE_ACTIVITIES[activity.activityType]

                    return (
                      <div
                        key={activity.id}
                        className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 opacity-60"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl">
                            {activityInfo.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-neutral-700 dark:text-neutral-300">
                              {activityInfo.label}
                            </span>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                              {activity.locationName || activity.area} · {activity.participantCount}/{activity.waveThreshold} joined
                            </p>
                          </div>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {activity.isUnlocked ? 'Unlocked' : 'Expired'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <div className="h-20" />
    </div>
  )
}
