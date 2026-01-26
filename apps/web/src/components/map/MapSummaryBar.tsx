'use client'

import { motion } from 'framer-motion'
import { Calendar, Users, Flame, ChevronRight } from 'lucide-react'

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
      <motion.div
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Stats */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center shadow-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalEvents}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Events</p>
              </div>
            </motion.div>

            <div className="w-px h-10 bg-gray-200" />

            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalAttendees}</p>
                <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Going</p>
              </div>
            </motion.div>
          </div>

          {/* Hot spot indicator */}
          {hotSpot && (
            <motion.button
              onClick={() => onHotSpotClick?.(hotSpot.id)}
              className="flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 rounded-xl transition-all border border-orange-100/50 group"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Flame className="w-5 h-5 text-orange-500" fill="currentColor" />
              </motion.div>
              <div className="text-left">
                <p className="text-[10px] text-orange-600 font-semibold uppercase tracking-wide">Hot spot</p>
                <p className="text-sm font-bold text-gray-900">{hotSpot.name}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
