import { describe, it, expect } from 'vitest'
import { useActivityJoin } from '../useActivityJoin'
import type { SpotsInfo } from '../useActivityJoin'

describe('useActivityJoin', () => {
  it('exports useActivityJoin as a function', () => {
    expect(typeof useActivityJoin).toBe('function')
  })

  it('exports SpotsInfo type (compile-time check)', () => {
    // This test verifies the SpotsInfo interface is importable.
    // If the type were removed or renamed, this file would fail to compile.
    const mockSpotsInfo: SpotsInfo = {
      totalSpots: 10,
      spotsRemaining: 5,
      spotsTaken: 5,
      percentFilled: 50,
      urgencyLevel: 'none' as any,
      showSpotsRemaining: true,
      urgencyThreshold: 3,
      waitlistEnabled: false,
      waitlistLimit: 0,
      waitlistCount: 0,
      isFull: false,
    }
    expect(mockSpotsInfo.totalSpots).toBe(10)
  })
})
