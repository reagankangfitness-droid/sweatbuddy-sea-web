'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { Logo } from '@/components/logo'
import { BackButton } from '@/components/host/BackButton'
import { EditEventForm } from '@/components/host/EditEventForm'

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
  // Capacity fields
  maxSpots?: number | null
  isFull?: boolean
  currentAttendees?: number
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
        // First verify session
        const sessionRes = await fetch('/api/organizer/verify', { method: 'POST' })
        if (!sessionRes.ok) {
          router.push('/organizer')
          return
        }

        // Fetch event
        const eventRes = await fetch(`/api/host/events/${eventId}`)
        if (!eventRes.ok) {
          if (eventRes.status === 401) {
            router.push('/organizer')
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <header className="border-b border-neutral-100">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
            </Link>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center">
            <p className="text-neutral-500 mb-4">{error}</p>
            <Link
              href="/host/dashboard"
              className="px-4 py-2 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-700 transition-colors"
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
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-neutral-100">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={24} />
            <span className="text-lg font-bold text-neutral-900">sweatbuddies</span>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Back button */}
        <div className="flex items-center gap-2 mb-8">
          <BackButton fallbackHref="/host/dashboard" />
          <span className="text-sm text-neutral-500">Back</span>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-2">
          Edit Event
        </h1>
        <p className="text-neutral-500 mb-8">Make changes and save when you&apos;re done</p>

        <EditEventForm event={event} />
      </main>
    </div>
  )
}
