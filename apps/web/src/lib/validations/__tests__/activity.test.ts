import { describe, it, expect } from 'vitest'
import { activitySchema } from '../activity'

describe('Activity Schema Validation', () => {
  it('validates a complete activity object', () => {
    const validActivity = {
      name: 'Morning Run',
      description: 'A refreshing morning run',
      city: 'Bangkok',
      latitude: 13.7563,
      longitude: 100.5018,
    }

    const result = activitySchema.safeParse(validActivity)
    expect(result.success).toBe(true)
  })

  it('validates activity without optional description', () => {
    const validActivity = {
      name: 'Morning Run',
      city: 'Bangkok',
      latitude: 13.7563,
      longitude: 100.5018,
    }

    const result = activitySchema.safeParse(validActivity)
    expect(result.success).toBe(true)
  })

  it('rejects activity with short name', () => {
    const invalidActivity = {
      name: 'AB', // Too short (min 3 chars)
      city: 'Bangkok',
      latitude: 13.7563,
      longitude: 100.5018,
    }

    const result = activitySchema.safeParse(invalidActivity)
    expect(result.success).toBe(false)
  })

  it('rejects activity with invalid latitude', () => {
    const invalidActivity = {
      name: 'Morning Run',
      city: 'Bangkok',
      latitude: 91, // Must be between -90 and 90
      longitude: 100.5018,
    }

    const result = activitySchema.safeParse(invalidActivity)
    expect(result.success).toBe(false)
  })

  it('rejects activity with invalid longitude', () => {
    const invalidActivity = {
      name: 'Morning Run',
      city: 'Bangkok',
      latitude: 13.7563,
      longitude: 181, // Must be between -180 and 180
    }

    const result = activitySchema.safeParse(invalidActivity)
    expect(result.success).toBe(false)
  })

  it('rejects activity with short description', () => {
    const invalidActivity = {
      name: 'Morning Run',
      description: 'Too short', // Min 10 characters
      city: 'Bangkok',
      latitude: 13.7563,
      longitude: 100.5018,
    }

    const result = activitySchema.safeParse(invalidActivity)
    expect(result.success).toBe(false)
  })

  it('validates activity with maximum valid coordinates', () => {
    const validActivity = {
      name: 'Arctic Expedition',
      city: 'North Pole',
      latitude: 90, // Max latitude
      longitude: 180, // Max longitude
    }

    const result = activitySchema.safeParse(validActivity)
    expect(result.success).toBe(true)
  })
})
