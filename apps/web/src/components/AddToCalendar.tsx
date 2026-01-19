'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ExternalLink } from 'lucide-react'
import {
  generateGoogleCalendarUrl,
  generateOutlookWebUrl,
  generateYahooCalendarUrl,
  downloadIcsFile,
  createCalendarEventFromData,
} from '@/lib/calendar'

interface Event {
  id?: string
  slug?: string | null
  name: string
  description?: string | null
  location: string
  eventDate?: string | null
  time: string
}

interface AddToCalendarProps {
  event: Event
  className?: string
  variant?: 'button' | 'icon'
}

export function AddToCalendar({ event, className = '', variant = 'button' }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const calendarEvent = createCalendarEventFromData(event)

  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(calendarEvent), '_blank')
    setIsOpen(false)
  }

  const handleOutlook = () => {
    window.open(generateOutlookWebUrl(calendarEvent), '_blank')
    setIsOpen(false)
  }

  const handleYahoo = () => {
    window.open(generateYahooCalendarUrl(calendarEvent), '_blank')
    setIsOpen(false)
  }

  const handleDownloadIcs = () => {
    const filename = `${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
    downloadIcsFile(calendarEvent, filename)
    setIsOpen(false)
  }

  const calendarOptions = [
    {
      label: 'Google Calendar',
      icon: '📅',
      onClick: handleGoogleCalendar,
    },
    {
      label: 'Apple Calendar',
      icon: '🍎',
      onClick: handleDownloadIcs,
    },
    {
      label: 'Outlook',
      icon: '📧',
      onClick: handleOutlook,
    },
    {
      label: 'Yahoo Calendar',
      icon: '🔮',
      onClick: handleYahoo,
    },
    {
      label: 'Download .ics',
      icon: '⬇️',
      onClick: handleDownloadIcs,
    },
  ]

  if (variant === 'icon') {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex flex-col items-center gap-1.5 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors ${className}`}
        >
          <span className="w-11 h-11 bg-white dark:bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-200 dark:border-neutral-600">
            <Calendar className="w-5 h-5" />
          </span>
          <span className="text-xs font-medium">Calendar</span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
            {calendarOptions.map((option) => (
              <button
                key={option.label}
                onClick={option.onClick}
                className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
              >
                <span>{option.icon}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors ${className}`}
      >
        <Calendar className="w-4 h-4" />
        <span>Add to Calendar</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-52 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 z-50">
          {calendarOptions.map((option) => (
            <button
              key={option.label}
              onClick={option.onClick}
              className="w-full px-4 py-2.5 text-left text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3 transition-colors"
            >
              <span>{option.icon}</span>
              <span>{option.label}</span>
              {option.label.includes('Calendar') && !option.label.includes('.ics') && (
                <ExternalLink className="w-3 h-3 ml-auto text-neutral-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
