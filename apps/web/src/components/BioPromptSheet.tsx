'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface BioPromptSheetProps {
  open: boolean
  onClose: () => void
}

const SUGGESTIONS = [
  'Morning runner, evening lifter',
  'Just trying to touch my toes',
  'Will show up for any cold plunge',
  'Weekend warrior, weekday walker',
  'Here for the post-workout coffee',
]

export function BioPromptSheet({ open, onClose }: BioPromptSheetProps) {
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!bio.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio: bio.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Bio saved!')
      // Mark as shown so it doesn't appear again
      try { localStorage.setItem('sb_bio_prompted', 'true') } catch {}
      onClose()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function skip() {
    try { localStorage.setItem('sb_bio_prompted', 'true') } catch {}
    onClose()
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
            onClick={skip}
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
              <div className="text-center mb-4 pt-2">
                <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
                  People want to know who they&apos;re sweating with
                </h3>
                <p className="text-xs text-[#9A9AAA] mt-1">Add a one-liner about yourself</p>
              </div>

              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={100}
                placeholder="e.g. Morning runner, evening lifter"
                className="w-full px-4 py-3 bg-[#FFFBF8] rounded-xl border border-black/[0.04] text-sm text-[#1A1A1A] placeholder:text-[#9A9AAA] focus:outline-none focus:border-black/[0.12] transition-all mb-3"
                autoFocus
              />

              {/* Suggestion chips */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setBio(s)}
                    className={`px-3 py-1.5 rounded-full text-[11px] transition-all ${
                      bio === s
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#FFFBF8] text-[#71717A] border border-black/[0.04] hover:border-black/[0.1]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <button
                onClick={save}
                disabled={!bio.trim() || saving}
                className="w-full py-3 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-black disabled:opacity-40 transition-all flex items-center justify-center gap-2 mb-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>

              <button onClick={skip} className="w-full text-center text-xs text-[#9A9AAA] py-2">
                Skip for now
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
