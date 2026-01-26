'use client'

import { Calendar, Users, Flame } from 'lucide-react'

interface MapSummaryBarProps {
  totalEvents: number
  totalAttendees: number
  hotSpot: {
    id: string
    name: string
  } | null
  onHotSpotClick?: (id: string) => void
}

export function MapSummaryBar({
  totalEvents,
  totalAttendees,
  hotSpot,
  onHotSpotClick,
}: MapSummaryBarProps) {
  return (
    <div className="absolute bottom-4 left-4 right-4 z-10">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-neutral-100 p-4">
        <div className="flex items-center justify-between">
          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900">{totalEvents}</p>
                <p className="text-xs text-neutral-500">Events</p>
              </div>
            </div>

            <div className="w-px h-10 bg-neutral-200" />

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-neutral-900">{totalAttendees}</p>
                <p className="text-xs text-neutral-500">Going</p>
              </div>
            </div>
          </div>

          {/* Hot spot indicator */}
          {hotSpot && (
            <button
              onClick={() => onHotSpotClick?.(hotSpot.id)}
              className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
            >
              <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />
              <div className="text-left">
                <p className="text-xs text-orange-600 font-medium">Hot spot</p>
                <p className="text-sm font-semibold text-neutral-900">{hotSpot.name}</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
