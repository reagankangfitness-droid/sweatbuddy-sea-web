'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Dynamically import the form to prevent SSR/hydration issues with Google Maps
const HostForm = dynamic(
  () => import('@/components/host/HostForm'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    ),
  }
)

export default function HostApplicationPage() {
  return <HostForm />
}
