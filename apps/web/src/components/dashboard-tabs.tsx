'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DashboardActivities } from '@/components/dashboard-activities'
import { JoinedActivitiesSection } from '@/components/joined-activities-section'
import { HostStatsDashboard } from '@/components/host-stats-dashboard'
import type { Activity } from '@prisma/client'

type MainTab = 'joined' | 'hosting' | 'stats'
type TimeTab = 'upcoming' | 'past'

interface UserActivity {
  id: string
  userId: string
  activityId: string
  status: string
  createdAt: Date
  updatedAt: Date
  activity: {
    id: string
    title: string
    description: string | null
    type: string
    city: string
    latitude: number
    longitude: number
    startTime: Date | null
    endTime: Date | null
    maxPeople: number | null
    imageUrl: string | null
    price: number
    currency: string
    status: string
    user: {
      id: string
      name: string | null
      email: string
      imageUrl: string | null
    }
    userActivities: Array<{
      user: {
        id: string
        name: string | null
        imageUrl: string | null
      }
    }>
  }
}

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

  return (
    <div>
      {/* Main Tab Navigation */}
      <div className="mb-6 border-b border-border overflow-x-auto">
        <div className="flex gap-4 sm:gap-8 min-w-max">
          <button
            onClick={() => setMainTab('joined')}
            className={`pb-3 px-1 font-semibold transition-colors relative whitespace-nowrap ${
              mainTab === 'joined'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '15px' }}
          >
            My Activities
            {mainTab === 'joined' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setMainTab('hosting')}
            className={`pb-3 px-1 font-semibold transition-colors relative whitespace-nowrap ${
              mainTab === 'hosting'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '15px' }}
          >
            Hosting
            {mainTab === 'hosting' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
          <button
            onClick={() => setMainTab('stats')}
            className={`pb-3 px-1 font-semibold transition-colors relative whitespace-nowrap ${
              mainTab === 'stats'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ fontSize: '15px' }}
          >
            Statistics
            {mainTab === 'stats' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Time Filter & Action Button Row (hide for stats tab) */}
      {mainTab !== 'stats' && (
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center mb-6">
          {/* Time Sub-tabs */}
          <div className="inline-flex rounded-lg border bg-background p-1 shadow-sm w-fit">
            <button
              onClick={() => setTimeTab('upcoming')}
              className={`px-3 sm:px-4 py-2 rounded-md font-semibold transition-colors ${
                timeTab === 'upcoming'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontSize: '13px' }}
            >
              Upcoming
            </button>
            <button
              onClick={() => setTimeTab('past')}
              className={`px-3 sm:px-4 py-2 rounded-md font-semibold transition-colors ${
                timeTab === 'past'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{ fontSize: '13px' }}
            >
              Past
            </button>
          </div>

          {/* Action Button (only show for Hosting tab) */}
          {mainTab === 'hosting' && (
            <Link href="/activities/new" className="w-full sm:w-auto">
              <Button size="default" className="w-full sm:w-auto">+ Host an Activity</Button>
            </Link>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="mt-6">
        {mainTab === 'joined' ? (
          <JoinedActivitiesSection
            bookings={joinedToShow}
            timeFilter={timeTab}
            userId={userId}
          />
        ) : mainTab === 'hosting' ? (
          <DashboardActivities initialActivities={hostedToShow} />
        ) : (
          <HostStatsDashboard />
        )}
      </div>
    </div>
  )
}
