import { describe, expect, it } from 'vitest'
import { compareByShowUpConfidence, getShowUpConfidence } from '@/lib/show-up-confidence'

const baseSession = {
  title: 'Easy Monday Run',
  description: 'All levels welcome, coffee after.',
  activityMode: 'P2P_FREE',
  categorySlug: 'running',
  address: 'Marina Bay, Singapore',
  latitude: 1.28,
  longitude: 103.86,
  startTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  maxPeople: 12,
  fitnessLevel: 'ALL',
  requiresApproval: false,
  attendeeCount: 4,
  goingSoloCount: 2,
  community: {
    id: 'crew-1',
    name: 'Monday Crew',
    communityLink: 'https://example.com/join',
    lastVerifiedAt: new Date().toISOString(),
  },
}

describe('show-up confidence', () => {
  it('marks clear solo-friendly plans as high confidence', () => {
    const confidence = getShowUpConfidence(baseSession)

    expect(confidence.level).toBe('High')
    expect(confidence.soloFriendly).toBe(true)
    expect(confidence.clearJoinPath).toBe(true)
    expect(confidence.badges).toEqual(expect.arrayContaining(['Good solo', 'People going', 'Easy join']))
  })

  it('penalizes generic inventory without a join path', () => {
    const confidence = getShowUpConfidence({
      title: 'Generic Gym Floor',
      categorySlug: 'gym',
      address: 'Somewhere',
      latitude: 1.3,
      longitude: 103.8,
      startTime: null,
      attendeeCount: 0,
      goingSoloCount: 0,
    })

    expect(confidence.level).toBe('Low')
    expect(confidence.clearJoinPath).toBe(false)
    expect(confidence.score).toBeLessThan(30)
  })

  it('sorts show-up confidence ahead of raw time order', () => {
    const genericSoon = {
      title: 'Soon But Vague',
      startTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
      address: 'CBD',
      latitude: 1.3,
      longitude: 103.8,
    }
    const confidentLater = {
      ...baseSession,
      title: 'Later But Easy To Join',
      startTime: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    }

    expect([genericSoon, confidentLater].sort(compareByShowUpConfidence)[0].title).toBe(
      'Later But Easy To Join',
    )
  })
})
