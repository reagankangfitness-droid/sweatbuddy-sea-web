import { describe, expect, it } from 'vitest'
import {
  getLocalDateString,
  getNextDatesForTimezone,
  inferSessionTimezone,
} from '../recurring-sessions'

describe('recurring sessions', () => {
  it('generates Bangkok recurring sessions in Bangkok local time', () => {
    const nextDates = getNextDatesForTimezone(
      3,
      '07:30',
      new Date('2026-06-09T06:00:00.000Z'),
      2,
      'Asia/Bangkok',
    )

    expect(nextDates.map((date) => date.toISOString())).toEqual([
      '2026-06-10T00:30:00.000Z',
      '2026-06-17T00:30:00.000Z',
    ])
  })

  it('generates Singapore recurring sessions in Singapore local time', () => {
    const nextDates = getNextDatesForTimezone(
      3,
      '07:30',
      new Date('2026-06-09T06:00:00.000Z'),
      1,
      'Asia/Singapore',
    )

    expect(nextDates[0]?.toISOString()).toBe('2026-06-09T23:30:00.000Z')
  })

  it('formats skipped dates in the template timezone', () => {
    expect(getLocalDateString(new Date('2026-06-09T17:30:00.000Z'), 'Asia/Bangkok')).toBe(
      '2026-06-10',
    )
    expect(getLocalDateString(new Date('2026-06-09T17:30:00.000Z'), 'Asia/Singapore')).toBe(
      '2026-06-10',
    )
  })

  it('infers timezone from Bangkok coordinates and address', () => {
    expect(
      inferSessionTimezone({
        city: 'Singapore',
        address: 'Benjakitti Park, Bangkok',
        latitude: 13.7226,
        longitude: 100.5608,
      }),
    ).toBe('Asia/Bangkok')
  })
})
