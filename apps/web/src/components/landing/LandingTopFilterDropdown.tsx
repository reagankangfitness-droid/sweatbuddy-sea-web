'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { TrackedLink } from '@/components/TrackedLink'
import { EVENTS } from '@/lib/analytics'

type FilterOption = {
  label: string
  href: string
}

export function LandingTopFilterDropdown({
  label,
  value,
  state,
  options,
}: {
  label: string
  value: string
  state: string
  options: FilterOption[]
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative min-w-0 font-mono">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex min-h-12 w-full touch-manipulation select-none items-center justify-between gap-2 rounded-md border-2 border-white/82 bg-[#0D0D0D] px-3 py-2 text-left shadow-[0_0_0_1px_rgba(255,255,255,0.08)] transition-colors hover:border-[#63FF8F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#63FF8F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0B0B] data-[open=true]:border-[#63FF8F] sm:gap-3 sm:px-4"
        data-open={open}
      >
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="block text-[11px] font-bold uppercase text-white/42">
              {label}
            </span>
            <span className="rounded-full bg-[#63FF8F]/12 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#63FF8F]">
              {state}
            </span>
          </span>
          <span className="mt-1 block truncate text-[13px] font-bold text-white sm:text-sm">
            {value}
          </span>
        </span>
        <ArrowRight
          size={16}
          className={`shrink-0 text-white/42 transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[80] max-h-[360px] overflow-y-auto rounded-md border border-white/14 bg-[#151515] p-1 shadow-2xl shadow-black/50">
          {options.map((option, index) => (
            <TrackedLink
              key={`${label}-${option.label}-${option.href}`}
              href={option.href}
              event={EVENTS.LANDING_CTA_CLICKED}
              metadata={{
                placement: `top_filter_${label.toLowerCase().replace(/\s+/g, '_')}_option`,
                destination: option.href,
                state,
                option: option.label,
              }}
              onClick={() => setOpen(false)}
              className={`flex min-h-11 items-center justify-between gap-2 rounded px-3 text-sm font-bold transition-colors ${
                index === 0
                  ? 'bg-[#63FF8F] text-black'
                  : 'bg-[#151515] text-white/76 hover:bg-[#242424] hover:text-white'
              }`}
            >
              <span className="truncate">{option.label}</span>
              {index === 0 && <Check className="h-4 w-4 shrink-0" />}
            </TrackedLink>
          ))}
        </div>
      )}
    </div>
  )
}
