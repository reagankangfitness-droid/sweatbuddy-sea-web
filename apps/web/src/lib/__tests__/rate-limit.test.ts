import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit } from '../rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset the in-memory store by allowing a fresh window
  })

  it('allows requests under the limit', () => {
    const result = checkRateLimit('user-1', 'test-endpoint', 5, 60000)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.retryAfterSeconds).toBeNull()
  })

  it('blocks requests over the limit', () => {
    const userId = 'user-block-test'
    const endpoint = 'block-endpoint'

    // Use up all 3 allowed requests
    for (let i = 0; i < 3; i++) {
      checkRateLimit(userId, endpoint, 3, 60000)
    }

    const result = checkRateLimit(userId, endpoint, 3, 60000)
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('tracks remaining count correctly', () => {
    const userId = 'user-remaining'
    const endpoint = 'remaining-endpoint'

    const r1 = checkRateLimit(userId, endpoint, 3, 60000)
    expect(r1.remaining).toBe(2)

    const r2 = checkRateLimit(userId, endpoint, 3, 60000)
    expect(r2.remaining).toBe(1)

    const r3 = checkRateLimit(userId, endpoint, 3, 60000)
    expect(r3.remaining).toBe(0)
  })

  it('isolates different user+endpoint combinations', () => {
    const r1 = checkRateLimit('user-a', 'ep-iso', 1, 60000)
    expect(r1.allowed).toBe(true)

    const r2 = checkRateLimit('user-b', 'ep-iso', 1, 60000)
    expect(r2.allowed).toBe(true)
  })
})
