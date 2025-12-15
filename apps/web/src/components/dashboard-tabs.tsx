'use client'

import { useState } from 'react'
import Link from 'next/link'
import { DashboardActivities } from '@/components/dashboard-activities'
import { JoinedActivitiesSection } from '@/components/joined-activities-section'
import { HostStatsDashboard } from '@/components/host-stats-dashboard'
import { Calendar, Users, BarChart3, Plus } from 'lucide-react'
import type { Activity } from '@prisma/client'

type MainTab = 'joined' | 'hosting' | 'stats'
type TimeTab = 'upcoming' | 'past'

interface DashboardTabsProps {
  initialHostedActivities: Activity[]
  initialJoinedBookings: any[]
  userId: string
}

export function DashboardTabs({
  initialHostedActivities,
  initialJoinedBookings,
  userId,
}: DashboardTabsProps) {
  const [mainTab, setMainTab] = useState<MainTab>('joined')
  const [timeTab, setTimeTab] = useState<TimeTab>('upcoming')

  // Filter hosted activities by time
  const now = new Date()
  const upcomingHosted = initialHostedActivities.filter(
    (a) => !a.startTime || new Date(a.startTime) >= now
  )
  const pastHosted = initialHostedActivities.filter(
    (a) => a.startTime && new Date(a.startTime) < now
  )

  // Filter joined bookings by time
  const upcomingJoined = initialJoinedBookings.filter(
    (b) => !b.activity.startTime || new Date(b.activity.startTime) >= now
  )
  const pastJoined = initialJoinedBookings.filter(
    (b) => b.activity.startTime && new Date(b.activity.startTime) < now
  )

  // Determine what to display
  const hostedToShow = timeTab === 'upcoming' ? upcomingHosted : pastHosted
  const joinedToShow = timeTab === 'upcoming' ? upcomingJoined : pastJoined

  const tabs = [
    { id: 'joined' as MainTab, label: 'My Activities', icon: Calendar },
    { id: 'hosting' as MainTab, label: 'Hosting', icon: Users },
    { id: 'stats' as MainTab, label: 'Statistics', icon: BarChart3 },
  ]

  return (
    <div>
      {/* Main Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = mainTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setMainTab(tab.id)}
                className={`
                  inline-flex items-center gap-2 px-5 py-3 rounded-xl font-heading font-semibold text-sm
                  transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white shadow-lg shadow-blue-500/25'
                    : 'bg-[#F0F9FF] text-[#0A1628]/70 hover:bg-[#e0f2fe] hover:text-[#0A1628]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Time Filter & Action Button Row (hide for stats tab) */}
      {mainTab !== 'stats' && (
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-8">
          {/* Time Sub-tabs */}
          <div className="inline-flex rounded-xl bg-[#F0F9FF] p-1.5 shadow-inner">
            <button
              onClick={() => setTimeTab('upcoming')}
              className={`
                px-5 py-2.5 rounded-lg font-heading font-semibold text-sm
                transition-all duration-300
                ${timeTab === 'upcoming'
                  ? 'bg-white text-[#0A1628] shadow-md'
                  : 'text-[#0A1628]/60 hover:text-[#0A1628]'
                }
              `}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeTab('past')}
              className={`
                px-5 py-2.5 rounded-lg font-heading font-semibold text-sm
                transition-all duration-300
                ${timeTab === 'past'
                  ? 'bg-white text-[#0A1628] shadow-md'
                  : 'text-[#0A1628]/60 hover:text-[#0A1628]'
                }
              `}
            >
              Past
            </button>
          </div>

          {/* Action Button (only show for Hosting tab) */}
          {mainTab === 'hosting' && (
            <Link href="/activities/new" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-heading font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
                <Plus className="w-4 h-4" />
                Host an Activity
              </button>
            </Link>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="mt-2">
        {mainTab === 'joined' ? (
          joinedToShow.length === 0 ? (
            <EmptyState
              title={timeTab === 'upcoming' ? 'No upcoming activities' : 'No past activities'}
              description={timeTab === 'upcoming'
                ? "You haven't joined any upcoming activities yet. Browse events to find something fun!"
                : "You don't have any past activities yet."
              }
              actionLabel="Browse Events"
              actionHref="/#events"
            />
          ) : (
            <JoinedActivitiesSection
              bookings={joinedToShow}
              timeFilter={timeTab}
              userId={userId}
            />
          )
        ) : mainTab === 'hosting' ? (
          hostedToShow.length === 0 ? (
            <EmptyState
              title={timeTab === 'upcoming' ? 'No upcoming hosted activities' : 'No past hosted activities'}
              description={timeTab === 'upcoming'
                ? "You're not hosting any upcoming activities. Create one to get started!"
                : "You haven't hosted any activities yet."
              }
              actionLabel="Host an Activity"
              actionHref="/activities/new"
            />
          ) : (
            <DashboardActivities initialActivities={hostedToShow} />
          )
        ) : (
          <HostStatsDashboard />
        )}
      </div>
    </div>
  )
}

function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string
  description: string
  actionLabel: string
  actionHref: string
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#F0F9FF] to-[#e0f2fe] flex items-center justify-center">
        <Calendar className="w-10 h-10 text-[#2563EB]" />
      </div>
      <h3 className="font-heading font-bold text-xl text-[#0A1628] mb-2">
        {title}
      </h3>
      <p className="font-body text-[#0A1628]/60 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <Link href={actionHref}>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] text-white font-heading font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-0.5">
          {actionLabel}
        </button>
      </Link>
    </div>
  )
}
