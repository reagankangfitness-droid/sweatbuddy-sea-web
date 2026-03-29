'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

export function JoinGateSheet({ open, onClose, onComplete }: JoinGateSheetProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function toggle(slug: string) {
    setSelected((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    )
  }

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
          fitnessLevel: 'ALL',
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-8 h-1 rounded-full bg-black/[0.1]" />
            </div>

            <div className="px-5 pb-[env(safe-area-inset-bottom,20px)]">
              <div className="text-center mb-5 pt-1">
                <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
                  One more thing before you join
                </h3>
                <p className="text-xs text-[#9A9AAA] mt-1">What are you into?</p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center mb-5">
                {INTERESTS.map((i) => (
                  <button
                    key={i.slug}
                    onClick={() => toggle(i.slug)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm transition-all ${
                      selected.includes(i.slug)
                        ? 'bg-[#1A1A1A] text-white shadow-md scale-105'
                        : 'bg-[#FFFBF8] text-[#4A4A5A] border border-black/[0.04] hover:border-black/[0.1]'
                    }`}
                  >
                    <span>{i.emoji}</span>
                    <span className="text-xs font-medium">{i.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={submit}
                disabled={selected.length === 0 || saving}
                className="w-full py-3.5 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-black disabled:opacity-30 transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                ) : (
                  `Let's go →`
                )}
              </button>

              {selected.length === 0 && (
                <p className="text-center text-[11px] text-[#9A9AAA] mt-2">Tap 1 or more to continue</p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
