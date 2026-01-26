'use client'

import { Map, List } from 'lucide-react'

interface ViewToggleProps {
  view: 'map' | 'list'
  onViewChange: (view: 'map' | 'list') => void
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg border border-neutral-200/50">
      <button
        onClick={() => onViewChange('map')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          view === 'map'
            ? 'bg-neutral-900 text-white shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        <Map className="w-4 h-4" />
        <span>Map</span>
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          view === 'list'
            ? 'bg-neutral-900 text-white shadow-sm'
            : 'text-neutral-600 hover:text-neutral-900'
        }`}
      >
        <List className="w-4 h-4" />
        <span>List</span>
      </button>
    </div>
  )
}
