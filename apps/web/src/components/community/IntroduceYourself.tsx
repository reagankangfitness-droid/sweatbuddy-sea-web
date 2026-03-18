'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface IntroduceYourselfProps {
  communitySlug: string
  communityName: string
  hasIntroduced: boolean
}

export function IntroduceYourself({
  communitySlug,
  communityName,
  hasIntroduced: hasIntroducedProp,
}: IntroduceYourselfProps) {
  const [introText, setIntroText] = useState('')
  const [sending, setSending] = useState(false)
  const [hidden, setHidden] = useState(hasIntroducedProp)

  // Check localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`sb_intro_${communitySlug}`)
      if (stored === 'true') {
        setHidden(true)
      }
    }
  }, [communitySlug])

  if (hidden) return null

  const handleSubmit = async () => {
    const content = introText.trim()
    if (!content || sending) return

    setSending(true)
    try {
      const res = await fetch(`/api/communities/${communitySlug}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to post introduction')
        return
      }

      // Mark as introduced
      if (typeof window !== 'undefined') {
        localStorage.setItem(`sb_intro_${communitySlug}`, 'true')
      }
      setHidden(true)
      toast.success('Introduction posted!')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
      <h3 className="text-base font-semibold text-[#1A1A1A]">
        Welcome to {communityName}! 👋
      </h3>
      <p className="text-sm text-[#4A4A5A] mt-1">
        Introduce yourself to the crew
      </p>
      <textarea
        value={introText}
        onChange={(e) => setIntroText(e.target.value)}
        placeholder="Hey, I'm [name]. I love running and I'm looking for a crew to push my pace..."
        className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm text-[#1A1A1A] placeholder:text-[#71717A] outline-none focus:border-amber-300 resize-none"
        rows={3}
        maxLength={5000}
      />
      <button
        onClick={handleSubmit}
        disabled={!introText.trim() || sending}
        className="mt-3 bg-[#1A1A1A] text-white rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-40 transition-opacity flex items-center gap-2"
      >
        {sending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        Post introduction
      </button>
    </div>
  )
}
