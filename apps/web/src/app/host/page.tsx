'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

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

export default function HostApplicationPage() {
  return <EventWizard mode="create" />
}
