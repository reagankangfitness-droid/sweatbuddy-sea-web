// Nudge signal type definitions

export type NudgeSignalType =
  | 'EVENT_RECOMMENDATION'
  | 'INACTIVITY_REENGAGEMENT'
  | 'LOW_FILL_RATE'
  | 'REGULARS_NOT_SIGNED_UP'

export interface NudgeContext {
  signalType: NudgeSignalType
  // Event recommendation
  eventName?: string
  eventId?: string
  eventSlug?: string
  organizerName?: string
  // Inactivity
  daysSinceLastActivity?: number
  userName?: string
  // Low fill rate
  fillPercent?: number
  daysUntilEvent?: number
  currentAttendees?: number
  // Regulars not signed up
  regularNames?: string[]
  regularCount?: number
}

export interface NudgeCopy {
  title: string // max 60 chars
  body: string // max 140 chars
}

export interface NudgeResult {
  sent: number
  skipped: number
  errors: number
}

export interface ProcessNudgesResult {
  inactivity: NudgeResult
  lowFillRate: NudgeResult
  regularsNotSignedUp: NudgeResult
  timestamp: string
}
