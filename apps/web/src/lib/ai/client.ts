import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export { anthropic }

export const AGENT_MODEL = 'claude-sonnet-4-20250514'

export interface AgentContext {
  organizerId: string
  organizerName: string
  organizerEmail: string
  instagramHandle: string
  totalEvents: number
  totalAttendees: number
  recentActivity: Array<{
    type: string
    attendeeName: string
    eventName: string
    timestamp: string
  }>
  topRegulars: Array<{
    name: string
    email: string
    attendanceCount: number
  }>
  atRiskMembers: Array<{
    name: string
    email: string
    daysSinceLastAttended: number
    totalAttendance: number
  }>
  upcomingEvents: Array<{
    id: string
    name: string
    date: string
    day: string
    time: string
    goingCount: number
  }>
  stats: {
    thisWeekRsvps: number
    lastWeekRsvps: number
    totalEarnings: number
    avgAttendeesPerEvent: number
  }
}
