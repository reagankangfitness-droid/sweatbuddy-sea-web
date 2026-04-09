'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ACTIVITY_TYPES } from '@/lib/activity-types'

interface JoinGateSheetProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const INTERESTS = ACTIVITY_TYPES.filter((t) => t.tier <= 2).map((t) => ({
  slug: t.key,
  emoji: t.emoji,
  label: t.label,
}))

const FITNESS_LEVELS = [
  { key: 'BEGINNER', emoji: '🌱', label: 'Beginner' },
  { key: 'INTERMEDIATE', emoji: '💪', label: 'Intermediate' },
  { key: 'ADVANCED', emoji: '🔥', label: 'Advanced' },
] as const

export function JoinGateSheet({ open, onClose, onComplete }: JoinGateSheetProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [fitnessLevel, setFitnessLevel] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose()
      }
    },
    [onClose]
  )

  async function submit() {
    if (selected.length === 0 || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/p2p-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bio: '',
          fitnessInterests: selected,
          fitnessLevel: fitnessLevel ?? 'ALL',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to save')
        return
      }
      onComplete()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-8 h-1 rounded-full bg-black/[0.1]" />
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-5 pb-[env(safe-area-inset-bottom,20px)]">
              {/* Header */}
              <div className="text-center mb-5 pt-1">
                <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
                  Quick setup before you join
                </h3>
                <p className="text-xs text-[#9A9AAA] mt-1">
                  Takes 10 seconds — pick your interests
                </p>
              </div>

              {/* Activity grid — 4 columns, emoji cards */}
              <div className="grid grid-cols-4 gap-2 mb-6">
                {INTERESTS.map((i) => (
                  <button
                    key={i.slug}
                    onClick={() => toggle(i.slug)}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all ${
                      selected.includes(i.slug)
                        ? 'bg-[#1A1A1A] text-white shadow-md scale-[1.04]'
                        : 'bg-[#FFFBF8] border border-black/[0.04] text-[#4A4A5A] hover:border-black/[0.1]'
                    }`}
                  >
                    <span className="text-2xl">{i.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight text-center px-0.5">
                      {i.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Fitness level */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-[#1A1A1A] mb-2">
                  Fitness level
                </p>
                <div className="flex gap-2">
                  {FITNESS_LEVELS.map((level) => (
                    <button
                      key={level.key}
                      onClick={() =>
                        setFitnessLevel((prev) =>
                          prev === level.key ? null : level.key
                        )
                      }
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                        fitnessLevel === level.key
                          ? 'bg-[#1A1A1A] text-white shadow-md'
                          : 'bg-[#FFFBF8] border border-black/[0.04] text-[#4A4A5A] hover:border-black/[0.1]'
                      }`}
                    >
                      <span>{level.emoji}</span>
                      <span>{level.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <button
                onClick={submit}
                disabled={selected.length === 0 || saving}
                className="w-full py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white text-sm font-semibold disabled:opacity-30 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Join session →'
                )}
              </button>

              {selected.length === 0 && (
                <p className="text-center text-[11px] text-[#9A9AAA] mt-2 mb-1">
                  Tap 1 or more to continue
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
