'use client'

import { useState, useEffect, useCallback } from 'react'
import { NudgeCard, type NudgeData } from './nudge-card'

export function NudgeCardsSection() {
  const [nudges, setNudges] = useState<NudgeData[]>([])

  useEffect(() => {
    const fetchNudges = async () => {
      try {
        const res = await fetch('/api/nudges/active')
        if (res.ok) {
          const data = await res.json()
          setNudges(data.nudges || [])
        }
      } catch {
        // Silently fail — nudges are non-critical
      }
    }

    fetchNudges()
  }, [])

  const handleDismiss = useCallback(async (nudgeId: string) => {
    // Optimistic removal
    setNudges((prev) => prev.filter((n) => n.id !== nudgeId))

    try {
      await fetch('/api/nudges/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nudgeId, action: 'dismissed' }),
      })
    } catch {
      // Silently fail — already removed from UI
    }
  }, [])

  if (nudges.length === 0) return null

  return (
    <div className="space-y-2">
      {nudges.map((nudge) => (
        <NudgeCard key={nudge.id} nudge={nudge} onDismiss={handleDismiss} />
      ))}
    </div>
  )
}
