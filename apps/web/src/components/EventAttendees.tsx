'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users } from 'lucide-react'

interface Attendee {
  id: string
  name: string
  color: string
}

interface EventAttendeesProps {
  eventId: string
  refreshTrigger?: number // Increment to trigger refresh
}

export function EventAttendees({ eventId, refreshTrigger = 0 }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAttendees = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`)
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.attendees || [])
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching attendees:', error)
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees, refreshTrigger])

  // Show nothing while loading
  if (isLoading) {
    return null
  }

  // Show nothing if no attendees
  if (count === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="text-base">👋</span>
          <span className="text-sm">Be the first to join!</span>
        </div>
      </div>
    )
  }

  const maxDisplay = 10
  const displayedAttendees = attendees.slice(0, maxDisplay)
  const surplus = count - maxDisplay

  return (
    <div className="flex items-center gap-3">
      {/* Avatar Stack */}
      <div className="flex -space-x-2 flex-wrap">
        {displayedAttendees.map((attendee, index) => (
          <div
            key={attendee.id}
            className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold shadow-sm transition-transform hover:scale-110 hover:z-20"
            style={{
              backgroundColor: attendee.color,
              zIndex: maxDisplay - index,
            }}
            title={attendee.name}
          >
            {attendee.name[0]?.toUpperCase() || '?'}
          </div>
        ))}

        {surplus > 0 && (
          <div
            className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold shadow-sm"
            style={{ zIndex: 0 }}
            title={`${surplus} more people`}
          >
            +{surplus}
          </div>
        )}
      </div>

      {/* Count text */}
      <div className="flex items-center gap-1.5 text-gray-600">
        <Users className="w-4 h-4 text-[#1800ad]" />
        <span className="text-sm font-medium">
          {count} {count === 1 ? 'person' : 'people'} going
        </span>
      </div>
    </div>
  )
}

// Compact version for cards
export function EventAttendeesCompact({ eventId, refreshTrigger = 0 }: EventAttendeesProps) {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [count, setCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchAttendees = useCallback(async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/attendees`)
      if (response.ok) {
        const data = await response.json()
        setAttendees(data.attendees || [])
        setCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error fetching attendees:', error)
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    fetchAttendees()
  }, [fetchAttendees, refreshTrigger])

  if (isLoading || count === 0) {
    return null
  }

  const displayedAttendees = attendees.slice(0, 3)
  const surplus = count - 3

  return (
    <div className="flex items-center gap-2">
      {/* Smaller Avatar Stack */}
      <div className="flex -space-x-1.5">
        {displayedAttendees.map((attendee, index) => (
          <div
            key={attendee.id}
            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold shadow-sm"
            style={{
              backgroundColor: attendee.color,
              zIndex: 10 - index,
            }}
            title={attendee.name}
          >
            {attendee.name[0]?.toUpperCase() || '?'}
          </div>
        ))}

        {surplus > 0 && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-medium shadow-sm"
            style={{ zIndex: 0 }}
          >
            +{surplus}
          </div>
        )}
      </div>

      <span className="text-xs text-gray-500 font-medium">
        {count} going
      </span>
    </div>
  )
}
