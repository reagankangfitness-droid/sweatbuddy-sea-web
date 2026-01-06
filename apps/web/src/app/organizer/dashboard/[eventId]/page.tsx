'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Redirect legacy organizer event page to unified host dashboard
export default function OrganizerEventRedirect() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.eventId as string

  useEffect(() => {
    router.replace(`/host/events/${eventId}/attendees`)
  }, [router, eventId])

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-500">Redirecting...</p>
      </div>
    </div>
  )
}
