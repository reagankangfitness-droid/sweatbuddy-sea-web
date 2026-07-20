import { describe, expect, it } from 'vitest'
import {
  compareListingsBySocialUsefulness,
  getListingPositioning,
  type ListingPositioningInput,
} from '@/lib/listing-positioning'

describe('listing positioning', () => {
  it('ranks a show-up listing above generic inventory', () => {
    const planReady = getListingPositioning({
      activities: ['running'],
      communityTypes: ['run club'],
      beginnerFriendly: true,
      dropInFriendly: true,
      socialScore: 85,
      trustScore: 90,
      upcomingPlanCount: 1,
      websiteUrl: 'https://example.com',
    })
    const genericGym = getListingPositioning({
      placeType: 'gym',
      activities: ['gym'],
      socialScore: 12,
      trustScore: 20,
      reviewCount: 0,
    })

    expect(planReady.intent).toBe('show_up_today')
    expect(planReady.joinPath).toBe('SweatBuddies RSVP')
    expect(planReady.publicPriority).toBe('Featured')
    expect(genericGym.intent).toBe('train_solo')
    expect(genericGym.publicPriority).toBe('Hidden')
    expect(planReady.score).toBeGreaterThan(genericGym.score)
  })

  it('recognizes social sports even when the listing is a facility', () => {
    const positioning = getListingPositioning({
      placeType: 'sports_facility',
      activities: ['pickleball'],
      vibeTags: ['social-sports'],
      dropInFriendly: true,
      socialScore: 58,
      googleReviewCount: 120,
    })

    expect(positioning.intent).toBe('try_social_sport')
    expect(positioning.joinPath).toBe('Drop-in friendly')
    expect(positioning.socialSignal).toMatch(/Strong|Medium/)
    expect(positioning.badges).toContain('Drop-in friendly')
  })

  it('sorts by social usefulness before raw reviews', () => {
    const places: Array<ListingPositioningInput & { name: string }> = [
      {
        name: 'Review Heavy Gym',
        placeType: 'gym',
        activities: ['gym'],
        googleReviewCount: 900,
        socialScore: 20,
      },
      {
        name: 'Beginner Run Crew',
        activities: ['running'],
        communityTypes: ['run club'],
        beginnerFriendly: true,
        socialScore: 82,
        reviewCount: 12,
      },
    ]

    expect([...places].sort(compareListingsBySocialUsefulness).map((place) => place.name)).toEqual([
      'Beginner Run Crew',
      'Review Heavy Gym',
    ])
  })
})
