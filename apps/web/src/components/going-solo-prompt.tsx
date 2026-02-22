'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { safeGetJSON, safeSetJSON } from '@/lib/safe-storage'
import { Users } from 'lucide-react'

interface GoingSoloPromptProps {
  activityId: string
  onOptIn: () => void
}

export function GoingSoloPrompt({ activityId, onOptIn }: GoingSoloPromptProps) {
  const storageKey = `going_solo_seen_${activityId}`
  const [visible, setVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const seen = safeGetJSON<boolean>(storageKey, false)
    if (!seen) {
      setVisible(true)
    }
  }, [storageKey])

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => {
      safeSetJSON(storageKey, true)
      setVisible(false)
    }, 10000)
    return () => clearTimeout(timer)
  }, [visible, storageKey])

  const handleOptIn = async () => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/events/${activityId}/going-solo`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed')
      safeSetJSON(storageKey, true)
      setVisible(false)
      onOptIn()
    } catch {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    safeSetJSON(storageKey, true)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-amber-100 dark:bg-amber-900/50 p-2 shrink-0">
          <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Going solo? Let others know you&apos;re open to meeting people!
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleOptIn}
              disabled={isSubmitting}
              className="h-8 text-xs"
            >
              {isSubmitting ? 'Saving...' : "Yes, I'm going solo"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSkip}
              className="h-8 text-xs text-muted-foreground"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
