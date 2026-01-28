'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, MapPin, Users, DollarSign } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import type { HostedActivityData } from './ActivityBubblePin'

interface ActivityDetailSheetProps {
  activity: HostedActivityData | null
  onClose: () => void
}

export function ActivityDetailSheet({ activity, onClose }: ActivityDetailSheetProps) {
  if (!activity) return null

  const spotsLeft = activity.maxPeople
    ? activity.maxPeople - activity.participantCount
    : null

  return (
    <AnimatePresence>
      <motion.div
        className="absolute bottom-20 left-4 right-4 z-20 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
      >
        {/* Image */}
        {activity.imageUrl && (
          <div className="relative w-full h-32">
            <Image
              src={activity.imageUrl}
              alt={activity.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-4 pt-4 pb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-neutral-900 dark:text-white truncate">
              {activity.title}
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mt-1">
              {activity.startTime && (
                <span className="flex items-center gap-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(activity.startTime).toLocaleDateString(undefined, {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </span>
              )}
              {(activity.address || activity.city) && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  {activity.address || activity.city}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 px-4 pb-2 text-sm text-neutral-600 dark:text-neutral-400">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {activity.participantCount} joined
            {spotsLeft != null && ` · ${spotsLeft} left`}
          </span>
          {activity.price > 0 && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              {activity.currency} {activity.price}
            </span>
          )}
          {activity.price === 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
          )}
        </div>

        {/* Host */}
        {activity.hostName && (
          <div className="flex items-center gap-2 px-4 pb-2">
            {activity.hostImageUrl ? (
              <Image
                src={activity.hostImageUrl}
                alt={activity.hostName}
                width={20}
                height={20}
                className="w-5 h-5 rounded-full"
                unoptimized
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            )}
            <span className="text-xs text-neutral-500">Hosted by {activity.hostName}</span>
          </div>
        )}

        {/* Action */}
        <div className="px-4 pb-4">
          <Link href={`/activities/${activity.id}`}>
            <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
              View Activity
            </button>
          </Link>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
