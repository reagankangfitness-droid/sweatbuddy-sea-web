'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventSummaryCard } from '@/components/host/EventSummaryCard'

export default function EventSummaryPage() {
  const params = useParams()
  const eventId = params.eventId as string

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-neutral-900 mb-6">Post-Event Summary</h1>

        <EventSummaryCard eventId={eventId} />
      </div>
    </div>
  )
}
