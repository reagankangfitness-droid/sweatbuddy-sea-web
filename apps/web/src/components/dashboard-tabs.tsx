'use client'

import { useState, useCallback, useRef, KeyboardEvent } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardActivities } from '@/components/dashboard-activities'
import { JoinedActivitiesSection, type JoinedBooking } from '@/components/joined-activities-section'
import { HostStatsDashboard } from '@/components/host-stats-dashboard'
import { Calendar, Users, BarChart3 } from 'lucide-react'
import type { Activity } from '@prisma/client'

type MainTab = 'joined' | 'hosting' | 'stats'
type TimeTab = 'upcoming' | 'past'

const TABS: { id: MainTab; label: string; icon: typeof Calendar }[] = [
  { id: 'joined', label: 'My Activities', icon: Calendar },
  { id: 'hosting', label: 'Hosting', icon: Users },
  { id: 'stats', label: 'Statistics', icon: BarChart3 },
]

interface DashboardTabsProps {
  initialHostedActivities: Activity[]
  initialJoinedBookings: JoinedBooking[]
  userId: string
}

export function DashboardTabs({
  initialHostedActivities,
  initialJoinedBookings,
  userId,
}: DashboardTabsProps) {
  const [mainTab, setMainTab] = useState<MainTab>('joined')
  const [timeTab, setTimeTab] = useState<TimeTab>('upcoming')
  const tabListRef = useRef<HTMLDivElement>(null)

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

  const tabs = TABS

  // Keyboard navigation for tabs
  const handleTabKeyDown = useCallback((e: KeyboardEvent, currentIndex: number) => {
    const tabButtons = tabListRef.current?.querySelectorAll('[role="tab"]')
    if (!tabButtons) return

    let newIndex = currentIndex

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault()
        newIndex = (currentIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault()
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = tabs.length - 1
        break
      default:
        return
    }

    const newTab = tabButtons[newIndex] as HTMLButtonElement
    newTab?.focus()
    setMainTab(tabs[newIndex].id)
  }, [tabs])

  return (
    <div>
      {/* Main Tab Navigation */}
      <div className="mb-8">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Dashboard sections"
          className="flex flex-wrap gap-2"
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = mainTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setMainTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`
                  inline-flex items-center gap-2 px-5 py-3 rounded-xl font-sans font-semibold text-sm
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2
                  ${isActive
                    ? 'bg-neutral-900 text-white shadow-md'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900 active:scale-[0.98]'
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
      <AnimatePresence mode="wait">
        {mainTab !== 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mb-8"
          >
            {/* Time Sub-tabs */}
            <div
              role="tablist"
              aria-label="Time filter"
              className="inline-flex rounded-xl bg-neutral-100 p-1.5"
            >
              <button
                role="tab"
                aria-selected={timeTab === 'upcoming'}
                onClick={() => setTimeTab('upcoming')}
                className={`
                  px-5 py-2.5 rounded-lg font-sans font-semibold text-sm
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1
                  ${timeTab === 'upcoming'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 active:scale-[0.98]'
                  }
                `}
              >
                Upcoming
              </button>
              <button
                role="tab"
                aria-selected={timeTab === 'past'}
                onClick={() => setTimeTab('past')}
                className={`
                  px-5 py-2.5 rounded-lg font-sans font-semibold text-sm
                  transition-all duration-200
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1
                  ${timeTab === 'past'
                    ? 'bg-white text-neutral-900 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 active:scale-[0.98]'
                  }
                `}
              >
                Past
              </button>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Area */}
      <div
        role="tabpanel"
        id={`panel-${mainTab}`}
        aria-labelledby={`tab-${mainTab}`}
        className="mt-2"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${mainTab}-${timeTab}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {mainTab === 'joined' ? (
              joinedToShow.length === 0 ? (
                <EmptyState
                  title={timeTab === 'upcoming' ? 'No upcoming activities' : 'No past activities'}
                  description={timeTab === 'upcoming'
                    ? "You haven't joined any upcoming activities yet. Browse experiences to find something fun!"
                    : "You don't have any past activities yet."
                  }
                  actionLabel="Browse Experiences"
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
                  actionLabel="Submit an Experience"
                  actionHref="/host/dashboard"
                />
              ) : (
                <DashboardActivities initialActivities={hostedToShow} />
              )
            ) : (
              <HostStatsDashboard />
            )}
          </motion.div>
        </AnimatePresence>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center py-16 px-4"
    >
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-100 flex items-center justify-center">
        <Calendar className="w-10 h-10 text-neutral-400" />
      </div>
      <h3 className="font-sans font-semibold text-xl text-neutral-900 mb-2">
        {title}
      </h3>
      <p className="font-sans text-neutral-500 mb-6 max-w-sm mx-auto">
        {description}
      </p>
      <Link href={actionHref}>
        <button className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 text-white font-sans font-semibold text-sm rounded-xl hover:bg-neutral-800 transition-all duration-200 active:scale-[0.98] shadow-md shadow-neutral-900/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2">
          {actionLabel}
        </button>
      </Link>
    </motion.div>
  )
}
