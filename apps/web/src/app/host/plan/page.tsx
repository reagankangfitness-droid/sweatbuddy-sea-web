'use client'

import Link from 'next/link'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { AIPlannerChat } from '@/components/host/AIPlannerChat'

export default function PlanPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/hub"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </Link>

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h1 className="text-2xl font-bold text-neutral-100">Plan Your Next Session</h1>
          </div>
          <p className="text-neutral-500 text-sm">
            Shape the next run, class, game, or meetup around what brings people back.
          </p>
        </div>

        <AIPlannerChat />
      </div>
    </div>
  )
}
