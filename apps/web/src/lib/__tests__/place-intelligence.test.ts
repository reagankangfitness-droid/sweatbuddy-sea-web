import { describe, expect, it } from 'vitest'
import {
  buildPlaceIntelligence,
  calculatePhotoQualityScore,
  calculatePlaceTrustScore,
  calculateReviewSentimentScore,
} from '@/lib/place-intelligence'

describe('place intelligence', () => {
  it('scores high-confidence Google-matched places strongly', () => {
    const place = {
      name: 'Strong Gym',
      area: 'Tanjong Pagar',
      address: '1 Gym Road, Singapore',
      activities: ['strength'],
      websiteUrl: 'https://example.com',
      sourceProvider: 'GOOGLE_PLACES',
      googlePlaceId: 'places/abc',
      googleRating: 4.8,
      googleReviewCount: 220,
      photos: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
      mediaAssetCount: 3,
      socialScore: 82,
      dropInFriendly: true,
    }

    expect(calculatePlaceTrustScore(place)).toBeGreaterThanOrEqual(90)
    expect(calculatePhotoQualityScore(place)).toBe(100)
    expect(calculateReviewSentimentScore(place)).toBeGreaterThanOrEqual(85)
  })

  it('flags places that need more source data', () => {
    const intelligence = buildPlaceIntelligence({
      name: 'Unverified Studio',
      area: 'Singapore',
      activities: ['yoga'],
      photos: [],
      googleReviewCount: 0,
      reviewCount: 0,
    })

    expect(intelligence.trustScore).toBeLessThan(60)
    expect(intelligence.photoQualityScore).toBe(0)
    expect(intelligence.aiCons).toContain('Google listing not matched yet')
    expect(intelligence.aiCons).toContain('Needs fresher venue photos')
  })
})
