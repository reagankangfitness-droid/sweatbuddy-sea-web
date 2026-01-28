'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, Users, Flame } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { HostedActivityData } from './ActivityBubblePin'

interface ActivityDetailSheetProps {
  activity: HostedActivityData | null
  onClose: () => void
}

// Get urgency badge based on timing
function getUrgencyBadge(activity: HostedActivityData): { label: string; color: string } | null {
  if (activity.isHappeningToday) {
    return { label: 'TODAY', color: 'bg-red-500' }
  }
  if (activity.isThisWeekend) {
    return { label: 'THIS WEEKEND', color: 'bg-orange-500' }
  }
  if (activity.startTime) {
    const date = new Date(activity.startTime)
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return { label: 'TOMORROW', color: 'bg-amber-500' }
    }
  }
  return null
}

// Format date nicely
function formatDateTime(dateStr: string | null, eventTime?: string): string {
  if (!dateStr) return eventTime || 'Time TBA'
  const date = new Date(dateStr)
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const time = eventTime || date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  return `${dayName}, ${monthDay} · ${time}`
}

export function ActivityDetailSheet({ activity, onClose }: ActivityDetailSheetProps) {
  if (!activity) return null

  const urgency = getUrgencyBadge(activity)
  const spotsLeft = activity.spotsLeft ?? (activity.maxPeople
    ? activity.maxPeople - activity.participantCount
    : null)
  const isFree = activity.price === 0

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-20 left-3 right-3 z-20 bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
        </div>

        {/* Top row: Urgency badge + Price + Close */}
        <div className="flex items-center justify-between px-4 pb-2">
          <div className="flex items-center gap-2">
            {urgency && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${urgency.color} flex items-center gap-1`}>
                <Flame className="w-3 h-3" />
                {urgency.label}
              </span>
            )}
            {activity.recurring && !urgency && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                WEEKLY
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isFree ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                Free
              </span>
            ) : (
              <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                ${activity.price} {activity.currency}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pb-2">
          <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">
            {activity.title}
          </h3>
        </div>

        {/* Date & Location */}
        <div className="px-4 pb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Calendar className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <span>{formatDateTime(activity.startTime, activity.eventTime)}</span>
          </div>
          {(activity.address || activity.city) && (
            <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <span className="truncate">{activity.address || activity.city}</span>
            </div>
          )}
        </div>

        {/* Host + Social Proof Row */}
        <div className="flex items-center justify-between px-4 pb-4 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          {/* Host */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {activity.hostImageUrl ? (
              <Image
                src={activity.hostImageUrl}
                alt={activity.hostName || 'Host'}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                unoptimized
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {activity.hostName?.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                {activity.hostName || 'Host'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                <Users className="w-3 h-3" />
                <span>{activity.participantCount} going</span>
                {spotsLeft !== null && spotsLeft > 0 && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className={spotsLeft <= 5 ? 'text-orange-500 font-medium' : ''}>
                      {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                    </span>
                  </>
                )}
                {activity.isFull && (
                  <>
                    <span className="text-neutral-300 dark:text-neutral-600">·</span>
                    <span className="text-red-500 font-medium">Full</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - All route to unified /e/[id] page */}
        <div className="flex gap-2 px-4 pb-4">
          <Link href={`/e/${activity.isEventSubmission ? activity.id.replace('event_', '') : activity.id}`} className="flex-1">
            <button className="w-full py-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
              View Details
            </button>
          </Link>
          <Link href={`/e/${activity.isEventSubmission ? activity.id.replace('event_', '') : activity.id}`} className="flex-1">
            <button className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm hover:from-pink-600 hover:to-rose-600 transition-colors shadow-lg shadow-pink-500/25">
              Join Now
            </button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
