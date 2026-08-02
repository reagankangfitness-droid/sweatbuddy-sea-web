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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#17130E]/42 px-3 py-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-choice-title"
      aria-describedby="create-choice-description"
    >
      <div className="w-full max-w-md rounded-lg border-2 border-[#17130E] bg-[#F4EFE3] p-4 text-[#17130E] shadow-[4px_4px_0_#17130E]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#0B4BA8]">
              Add to the map
            </p>
            <h2 id="create-choice-title" className="mt-1 text-xl font-bold leading-tight text-[#17130E]">
              What can people show up to?
            </h2>
            <p id="create-choice-description" className="mt-1 text-xs leading-5 text-[#17130E]/62">
              Post a free session for review, or send us a community page to verify.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border-2 border-[#17130E] bg-[#F8F4EA] text-[#17130E] shadow-[2px_2px_0_#17130E] hover:bg-white"
            aria-label="Close create options"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={onHostSession}
            className="flex min-h-[76px] items-center gap-3 rounded-md border-2 border-[#17130E] bg-[#E8412C] text-left text-white shadow-[3px_3px_0_#17130E] transition-colors hover:bg-[#F0523E]"
          >
            <span className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-[#17130E] bg-[#F8F4EA] text-[#17130E]">
              <CalendarPlus className="h-5 w-5" />
            </span>
            <span className="min-w-0 pr-4">
              <span className="block text-sm font-black uppercase tracking-wide text-white">Post a session</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-white/78">
                Share a run, class, game, or wellness plan people can join.
              </span>
            </span>
          </button>

          <Link
            href="/communities/nominate"
            onClick={onClose}
            className="flex min-h-[76px] items-center gap-3 rounded-md border-2 border-[#17130E] bg-[#F8F4EA] text-left shadow-[3px_3px_0_#17130E] transition-colors hover:bg-white"
          >
            <span className="ml-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 border-[#17130E] bg-[#0B4BA8] text-white">
              <Users className="h-5 w-5" />
            </span>
            <span className="min-w-0 pr-4">
              <span className="block text-sm font-black uppercase tracking-wide text-[#17130E]">List or claim a community</span>
              <span className="mt-1 block text-xs font-semibold leading-5 text-[#17130E]/62">
                Verify the official link so you can post trusted, paid, or recurring sessions.
              </span>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
