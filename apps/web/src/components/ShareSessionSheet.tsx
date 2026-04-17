'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Link2, Check, X } from 'lucide-react'
import { Instagram } from '@/components/icons/InstagramIcon'
import { useState } from 'react'
import { toast } from 'sonner'

interface ShareSessionSheetProps {
  open: boolean
  onClose: () => void
  sessionId: string
  sessionTitle: string
  sessionTime?: string | null
  sessionLocation?: string | null
  spotsLeft?: number | null
  goingCount?: number
  /** 'created' = host just posted, 'joined' = attendee just joined */
  context: 'created' | 'joined'
}

function formatTimeShort(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()

  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return `today at ${time}`
  if (isTomorrow) return `tomorrow at ${time}`
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + ` at ${time}`
}

export function ShareSessionSheet({
  open,
  onClose,
  sessionId,
  sessionTitle,
  sessionTime,
  sessionLocation,
  spotsLeft,
  goingCount = 0,
  context,
}: ShareSessionSheetProps) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.sweatbuddies.co'
  const sessionUrl = `${baseUrl}/activities/${sessionId}`

  const timeStr = sessionTime ? formatTimeShort(sessionTime) : ''
  const locationStr = sessionLocation?.split(',')[0] ?? ''

  // Build share messages
  const hostMessage = [
    `I'm hosting ${sessionTitle}${timeStr ? ` ${timeStr}` : ''}${locationStr ? ` at ${locationStr}` : ''}.`,
    spotsLeft ? `${spotsLeft} spots left.` : '',
    'Join me? 👇',
    sessionUrl,
  ].filter(Boolean).join(' ')

  const joinMessage = [
    `I'm going to ${sessionTitle}${timeStr ? ` ${timeStr}` : ''}${locationStr ? ` at ${locationStr}` : ''}.`,
    goingCount > 1 ? `${goingCount} people going.` : '',
    'Come with me?',
    sessionUrl,
  ].filter(Boolean).join(' ')

  const message = context === 'created' ? hostMessage : joinMessage

  function shareWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
    onClose()
  }

  function shareInstagram() {
    // Instagram doesn't support direct share links, so copy the link + open IG
    navigator.clipboard.writeText(sessionUrl).then(() => {
      toast.success('Link copied! Paste it in your IG Story')
      window.open('https://instagram.com', '_blank')
      onClose()
    }).catch(() => {
      toast.error('Could not copy link')
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(sessionUrl).then(() => {
      setCopied(true)
      toast.success('Link copied!')
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {
      toast.error('Could not copy link')
    })
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({
        title: sessionTitle,
        text: message,
        url: sessionUrl,
      }).then(onClose).catch(() => {})
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1.5 rounded-full bg-black/[0.08]" />
            </div>

            <div className="px-5 pb-[env(safe-area-inset-bottom,20px)]">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#1A1A1A] tracking-tight">
                    {context === 'created' ? 'Spread the word' : 'Know someone who\u2019d be in?'}
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    {context === 'created'
                      ? 'More people, better session'
                      : 'Tag them before spots fill up'}
                  </p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FFFBF8] flex items-center justify-center">
                  <X className="w-4 h-4 text-[#71717A]" />
                </button>
              </div>

              {/* Session preview */}
              <div className="bg-[#FFFBF8] rounded-xl p-3 mb-5 border border-black/[0.04]">
                <p className="text-sm font-semibold text-[#1A1A1A]">{sessionTitle}</p>
                <p className="text-xs text-[#71717A] mt-0.5">
                  {[timeStr, locationStr].filter(Boolean).join(' · ')}
                  {spotsLeft ? ` · ${spotsLeft} spots left` : ''}
                </p>
              </div>

              {/* Share buttons */}
              <div className="space-y-2.5 mb-4">
                <button
                  onClick={shareWhatsApp}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#25D366] text-white font-semibold text-sm hover:bg-[#22c55e] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Share on WhatsApp
                </button>

                <button
                  onClick={shareInstagram}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <Instagram className="w-5 h-5" />
                  Share to Instagram Story
                </button>

                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={nativeShare}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#1A1A1A] text-white font-semibold text-sm hover:bg-black transition-colors"
                  >
                    <Link2 className="w-5 h-5" />
                    More options...
                  </button>
                )}

                <button
                  onClick={copyLink}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border border-black/[0.06] bg-white text-[#4A4A5A] font-semibold text-sm hover:bg-[#FFFBF8] transition-colors"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Link2 className="w-5 h-5" />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>

              {/* Skip */}
              <button
                onClick={onClose}
                className="w-full text-center text-xs text-[#9A9AAA] hover:text-[#71717A] py-2 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
