'use client'

import Link from 'next/link'
import { CalendarPlus, Users, X } from 'lucide-react'

interface CreateChoiceSheetProps {
  open: boolean
  onClose: () => void
  onHostSession: () => void
}

export function CreateChoiceSheet({ open, onClose, onHostSession }: CreateChoiceSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-3 py-3 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.10] bg-[#101010] p-4 text-white shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#63FF8F]">
              Add to the map
            </p>
            <h2 className="mt-1 text-xl font-bold leading-tight">What do you want to add?</h2>
            <p className="mt-1 text-xs leading-5 text-[#888888]">
              Publish a specific plan people can join, or send us a host/source page to review.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.10] text-[#999999] hover:bg-white/[0.08] hover:text-white"
            aria-label="Close create options"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={onHostSession}
            className="flex min-h-[76px] items-center gap-3 rounded-xl border border-white/[0.10] bg-white text-left text-black transition-colors hover:bg-neutral-200"
          >
            <span className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white">
              <CalendarPlus className="h-5 w-5" />
            </span>
            <span className="min-w-0 pr-4">
              <span className="block text-sm font-black uppercase tracking-wide">Host an event</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-black/58">
                Publish a run, class, game, or wellness plan people can join.
              </span>
            </span>
          </button>

          <Link
            href="/communities/create"
            onClick={onClose}
            className="flex min-h-[76px] items-center gap-3 rounded-xl border border-white/[0.10] bg-[#181818] text-left transition-colors hover:border-[#63FF8F]"
          >
            <span className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-black text-white">
              <Users className="h-5 w-5" />
            </span>
            <span className="min-w-0 pr-4">
              <span className="block text-sm font-black uppercase tracking-wide text-white">Submit a source</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-[#888888]">
                Send us the official link so we can review and map it.
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
