'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import type { EventFormData } from '@/lib/validations/event'

const EventWizard = dynamic(
  () => import('@/components/host/event-wizard/EventWizard').then(m => ({ default: m.EventWizard })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    ),
  }
)

interface Event {
  id: string
  name: string
  category: string
  day: string
  date: string | null
  time: string
  location: string
  description: string | null
  imageUrl: string | null
  recurring: boolean
  isFree?: boolean
  price?: number | null
  paynowQrCode?: string | null
  paynowNumber?: string | null
  stripeEnabled?: boolean
  maxSpots?: number | null
  isFull?: boolean
  currentAttendees?: number
}

function mapEventToFormData(event: Event): Partial<EventFormData> {
  // Convert 12-hour time (e.g. "7:00 AM") to 24-hour (e.g. "07:00")
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return ''
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i)
    if (!match) return time12
    let hours = parseInt(match[1], 10)
    const minutes = match[2]
    const period = match[3]?.toUpperCase()
    if (period === 'PM' && hours !== 12) hours += 12
    if (period === 'AM' && hours === 12) hours = 0
    return `${hours.toString().padStart(2, '0')}:${minutes}`
  }

  return {
    eventName: event.name || '',
    description: event.description || '',
    eventType: event.category || '',
    eventDate: event.date || '',
    eventTime: convertTo24Hour(event.time),
    endTime: '',
    location: event.location || '',
    latitude: 0,
    longitude: 0,
    placeId: '',
    isRecurring: event.recurring || false,
    eventDay: event.recurring ? event.day : '',
    isFree: event.isFree ?? true,
    price: event.price ? (event.price / 100).toFixed(2) : '',
    paynowQrCode: event.paynowQrCode || '',
    paynowNumber: event.paynowNumber || '',
    stripeEnabled: event.stripeEnabled || false,
    maxSpots: event.maxSpots?.toString() || '',
    isFull: event.isFull || false,
    imageUrl: event.imageUrl || null,
    organizerName: '',
    instagramHandle: '',
    email: '',
  }
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/sign-in?intent=host')
          return
        }

        const eventRes = await fetch(`/api/host/events/${eventId}`)
        if (!eventRes.ok) {
          if (eventRes.status === 401) {
            router.push('/sign-in?intent=host')
            return
          }
          if (eventRes.status === 404) {
            setError('We couldn\'t find that experience')
            return
          }
          if (eventRes.status === 403) {
            setError('You don\'t have permission to edit this experience')
            return
          }
          throw new Error('Couldn\'t load the experience. Try again?')
        }

        const eventData = await eventRes.json()
        setEvent(eventData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [router, eventId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <header className="border-b border-neutral-800">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-white">sweatbuddies</span>
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-neutral-400 mb-4">{error}</p>
            <Link
              href="/host/dashboard"
              className="px-4 py-2 bg-neutral-950 text-neutral-100 rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    )
  }

  if (!event) {
    return null
  }

  return (
    <EventWizard
      mode="edit"
      eventId={event.id}
      initialData={mapEventToFormData(event)}
      currentAttendees={event.currentAttendees}
    />
  )
}
