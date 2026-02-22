import { describe, it, expect } from 'vitest'
import { activitySchema } from '../activity'

const validBase = {
  title: 'Morning Run',
  description: 'A refreshing morning run through the park',
  type: 'RUN' as const,
  city: 'Bangkok',
  latitude: 13.7563,
  longitude: 100.5018,
  startTime: '2026-03-01T07:00:00.000Z',
  endTime: '2026-03-01T08:00:00.000Z',
  imageUrl: 'https://example.com/image.jpg',
  price: 0,
  currency: 'SGD',
}

describe('Activity Schema Validation', () => {
  it('validates a complete activity object', () => {
    const result = activitySchema.safeParse(validBase)
    expect(result.success).toBe(true)
  })

  it('validates activity with optional fields', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      maxPeople: 20,
      address: '123 Main Street',
      placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      categorySlug: 'running',
    })
    expect(result.success).toBe(true)
  })

  it('rejects activity with short title', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      title: 'AB', // Too short (min 3 chars)
    })
    expect(result.success).toBe(false)
  })

  it('rejects activity with invalid latitude', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      latitude: 91, // Must be between -90 and 90
    })
    expect(result.success).toBe(false)
  })

  it('rejects activity with invalid longitude', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      longitude: 181, // Must be between -180 and 180
    })
    expect(result.success).toBe(false)
  })

  it('rejects activity with empty description', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      description: '', // Min 1 character
    })
    expect(result.success).toBe(false)
  })

  it('validates activity with maximum valid coordinates', () => {
    const result = activitySchema.safeParse({
      ...validBase,
      title: 'Arctic Expedition',
      city: 'North Pole',
      latitude: 90, // Max latitude
      longitude: 180, // Max longitude
    })
    expect(result.success).toBe(true)
  })
})
