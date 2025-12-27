'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, DollarSign } from 'lucide-react'
import { DashboardHeader } from '@/components/host/DashboardHeader'
import { StatCard } from '@/components/host/StatCard'
import { UpcomingEventRow } from '@/components/host/UpcomingEventRow'
import { PastEventRow } from '@/components/host/PastEventRow'
import { EmptyState } from '@/components/host/EmptyState'

interface DashboardEvent {
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
  stats: {
    activeEvents: number
    totalSignups: number
    totalEarnings?: number  // in cents
    totalRevenue?: number   // in cents
    paidAttendees?: number
  }
  upcoming: DashboardEvent[]
  past: DashboardEvent[]
}

export default function HostDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Fetch dashboard data
        const dashboardRes = await fetch('/api/host/dashboard')
        if (!dashboardRes.ok) {
          if (dashboardRes.status === 401) {
            router.push('/organizer')
            return
          }
          throw new Error('Failed to load dashboard')
        }

        const dashboardData = await dashboardRes.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-neutral-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Welcome */}
        <h1 className="text-2xl font-bold text-neutral-900 mb-8">
          Welcome back!
        </h1>

        {/* Earnings Banner */}
        {data.stats.totalEarnings && data.stats.totalEarnings > 0 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-900">
                  ${(data.stats.totalEarnings / 100).toFixed(2)} earned
                </p>
                <p className="text-sm text-green-700">
                  From {data.stats.paidAttendees || 0} paid attendee{(data.stats.paidAttendees || 0) !== 1 ? 's' : ''} via Stripe
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          <StatCard value={data.stats.activeEvents} label="Active Events" />
          <StatCard value={data.stats.totalSignups} label="Total RSVPs" />
          <StatCard
            value={data.stats.totalEarnings ? `$${(data.stats.totalEarnings / 100).toFixed(0)}` : '—'}
            label="Earnings"
          />
        </div>

        {/* Upcoming Events */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Upcoming Events
          </h2>

          {data.upcoming.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {data.upcoming.map((event) => (
                <UpcomingEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>

        {/* Past Events */}
        {data.past.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Past Events
              </h2>
            </div>
            <div className="border border-neutral-200 rounded-xl divide-y divide-neutral-100">
              {data.past.map((event) => (
                <PastEventRow key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
