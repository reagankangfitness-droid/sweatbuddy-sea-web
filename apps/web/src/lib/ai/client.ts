import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export { anthropic }

export const AGENT_MODEL = 'claude-sonnet-4-20250514'

// Community type enum matching Prisma schema
export type CommunityType = 'RUN' | 'YOGA' | 'HIIT' | 'MEDITATION' | 'BOOTCAMP' | 'STRENGTH' | 'OTHER' | null

export interface CommunityProfile {
  communityType: CommunityType
  communityName: string | null
  communityLocation: string | null
  communitySchedule: string | null
  communitySize: string | null
}

export interface AgentContext {
  organizerId: string
  organizerName: string
  organizerEmail: string
  instagramHandle: string
  // Community profile from onboarding
  communityProfile: CommunityProfile
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

// Category-specific insights for AI prompts
export const COMMUNITY_TYPE_CONTEXT: Record<string, {
  name: string
  activities: string[]
  commonChallenges: string[]
  growthTips: string[]
  contentIdeas: string[]
}> = {
  RUN: {
    name: 'Running Community',
    activities: ['group runs', 'interval training', 'long runs', 'recovery runs', 'race prep'],
    commonChallenges: ['weather cancellations', 'varying pace groups', 'injury prevention', 'early morning motivation'],
    growthTips: ['partner with local shoe stores', 'create pace-based groups', 'host race training programs', 'organize scenic route discoveries'],
    contentIdeas: ['route maps', 'pace group announcements', 'race day tips', 'runner spotlights', 'post-run stretching routines'],
  },
  YOGA: {
    name: 'Yoga Community',
    activities: ['vinyasa flow', 'yin yoga', 'power yoga', 'restorative sessions', 'meditation'],
    commonChallenges: ['space limitations', 'outdoor weather', 'beginner vs advanced levels', 'equipment access'],
    growthTips: ['offer intro workshops', 'create themed sessions', 'partner with wellness brands', 'host retreats'],
    contentIdeas: ['pose tutorials', 'breathing exercises', 'mindfulness tips', 'session themes', 'student progress stories'],
  },
  HIIT: {
    name: 'HIIT Community',
    activities: ['circuit training', 'tabata', 'AMRAP workouts', 'EMOM sessions', 'partner workouts'],
    commonChallenges: ['intensity scaling', 'equipment sharing', 'noise concerns', 'injury risk management'],
    growthTips: ['create challenge programs', 'track member progress', 'host fitness challenges', 'partner with nutrition brands'],
    contentIdeas: ['workout of the day', 'form tips', 'before/after transformations', 'equipment-free alternatives', 'energy boosting playlists'],
  },
  MEDITATION: {
    name: 'Meditation Community',
    activities: ['guided meditation', 'breathwork', 'sound healing', 'walking meditation', 'journaling sessions'],
    commonChallenges: ['finding quiet spaces', 'beginner engagement', 'maintaining consistency', 'digital distractions'],
    growthTips: ['offer corporate wellness sessions', 'create themed series', 'partner with wellness apps', 'host silent retreats'],
    contentIdeas: ['daily affirmations', 'breathing techniques', 'mindfulness reminders', 'peaceful location shots', 'member testimonials'],
  },
  BOOTCAMP: {
    name: 'Bootcamp Community',
    activities: ['outdoor training', 'team workouts', 'obstacle training', 'strength circuits', 'cardio drills'],
    commonChallenges: ['weather dependency', 'public space permits', 'equipment transport', 'diverse fitness levels'],
    growthTips: ['create team-based competitions', 'partner with parks', 'offer transformation programs', 'organize fitness challenges'],
    contentIdeas: ['workout highlights', 'team photos', 'exercise demos', 'member transformations', 'weather backup plans'],
  },
  STRENGTH: {
    name: 'Strength Training Community',
    activities: ['weight training', 'powerlifting', 'functional strength', 'technique workshops', 'progressive overload programs'],
    commonChallenges: ['equipment availability', 'gym space booking', 'safe spotting', 'programming progression'],
    growthTips: ['offer technique clinics', 'create PR tracking boards', 'host lifting meets', 'partner with supplement brands'],
    contentIdeas: ['lift technique tips', 'PR celebrations', 'programming advice', 'nutrition tips', 'recovery protocols'],
  },
  OTHER: {
    name: 'Fitness Community',
    activities: ['group workouts', 'training sessions', 'community events'],
    commonChallenges: ['member retention', 'scheduling', 'growth'],
    growthTips: ['engage regularly', 'celebrate milestones', 'create unique experiences'],
    contentIdeas: ['event announcements', 'member highlights', 'tips and advice', 'community updates'],
  },
}
