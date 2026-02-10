'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Users, Hand, Clock, Loader2 } from 'lucide-react'
import { CategoryBadge } from '@/components/category-badge'

interface FollowerInfo {
  id: string
  name: string | null
  firstName: string | null
  imageUrl: string | null
  slug: string | null
  followedAt: string
}

interface InterestSignal {
  id: string
  categorySlug: string | null
  message: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    firstName: string | null
    imageUrl: string | null
    slug: string | null
  }
}

interface DemandData {
  followers: {
    total: number
    newLast30Days: number
    recent: FollowerInfo[]
  }
  interest: {
    total: number
    byCategory: { categorySlug: string | null; count: number }[]
    recentSignals: InterestSignal[]
  }
  typicalSchedule: {
    dayOfWeek: string | null
    hourOfDay: number | null
    topCategory: string | null
  }
}

function formatHour(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}

export function DemandSignalsCard() {
  const [data, setData] = useState<DemandData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDemand = async () => {
      try {
        const res = await fetch('/api/host/demand')
        if (res.ok) {
          const demandData = await res.json()
          setData(demandData)
        }
      } catch (err) {
        console.error('Failed to fetch demand data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDemand()
  }, [])

  if (loading) {
    return (
      <section>
        <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
          <span>📊</span>
          Demand Signals
        </h2>
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 bg-white dark:bg-neutral-900 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
        </div>
      </section>
    )
  }

  if (!data) return null

  const { followers, interest, typicalSchedule } = data

  return (
    <section>
      <h2 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2">
        <span>📊</span>
        Demand Signals
      </h2>
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
        {/* Stats Row */}
        <div className="grid grid-cols-3 divide-x divide-neutral-100 dark:divide-neutral-800 border-b border-neutral-100 dark:border-neutral-800">
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-neutral-900 dark:text-white">
              {followers.total}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Followers
              {followers.newLast30Days > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {' '}+{followers.newLast30Days}
                </span>
              )}
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Hand className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-neutral-900 dark:text-white">
              {interest.total}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Want more
            </div>
          </div>
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="text-sm font-bold text-neutral-900 dark:text-white leading-tight">
              {typicalSchedule.dayOfWeek
                ? `${typicalSchedule.dayOfWeek.slice(0, 3)}${typicalSchedule.hourOfDay !== null ? ` ${formatHour(typicalSchedule.hourOfDay)}` : ''}`
                : '—'}
            </div>
            <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
              Typical time
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        {interest.byCategory.length > 0 && (
          <div className="px-3 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-medium mb-2">
              What people want
            </p>
            <div className="flex flex-wrap gap-1.5">
              {interest.byCategory.slice(0, 5).map((item) => (
                <div key={item.categorySlug || 'general'} className="flex items-center gap-1">
                  {item.categorySlug ? (
                    <CategoryBadge slug={item.categorySlug} size="small" />
                  ) : (
                    <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-1.5 py-0.5 rounded">
                      General
                    </span>
                  )}
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Interest Signals */}
        {interest.recentSignals.length > 0 && (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {interest.recentSignals.slice(0, 5).map((signal) => (
              <div key={signal.id} className="px-3 py-2 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {signal.user.imageUrl ? (
                    <Image
                      src={signal.user.imageUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      {signal.user.firstName?.[0] || signal.user.name?.[0] || '?'}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-900 dark:text-white truncate">
                    <span className="font-medium">
                      {signal.user.firstName || signal.user.name?.split(' ')[0] || 'Someone'}
                    </span>
                    {' '}wants you to host
                    {signal.categorySlug && (
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {' '}({signal.categorySlug})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {followers.total === 0 && interest.total === 0 && (
          <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-xs">
              No demand signals yet. Share your profile to get followers and interest!
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
