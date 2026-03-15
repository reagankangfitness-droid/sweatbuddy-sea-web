import { describe, it, expect } from 'vitest'
import { APP_URL, SUPPORT_EMAIL, HELLO_EMAIL, DESCRIPTION_CHAR_LIMIT } from '../constants'

describe('constants', () => {
  it('has valid APP_URL', () => {
    expect(APP_URL).toMatch(/^https?:\/\//)
  })

  it('has valid email addresses', () => {
    expect(SUPPORT_EMAIL).toMatch(/@/)
    expect(HELLO_EMAIL).toMatch(/@/)
  })

  it('has reasonable DESCRIPTION_CHAR_LIMIT', () => {
    expect(DESCRIPTION_CHAR_LIMIT).toBeGreaterThan(0)
    expect(DESCRIPTION_CHAR_LIMIT).toBeLessThanOrEqual(1000)
  })
})
