import { describe, expect, it } from 'vitest'
import {
  getCityLocationConfigFromText,
  getCityLocationConfigForPointOrText,
  getNearestCityLocationConfig,
  isPointInsideCityDetectionRadius,
  getUtcDateForLocalDateTime,
  getUtcDateRangeForLocalDate,
} from '../location-config'

describe('location config', () => {
  it('detects Bangkok coordinates as Bangkok', () => {
    const city = getNearestCityLocationConfig(13.7563, 100.5018)

    expect(city.slug).toBe('bangkok')
    expect(city.timezone).toBe('Asia/Bangkok')
    expect(city.currency).toBe('THB')
    expect(city.neighborhoods.map((n) => n.name)).toContain('Sukhumvit / Asok')
  })

  it('detects Singapore coordinates as Singapore', () => {
    const city = getNearestCityLocationConfig(1.3521, 103.8198)

    expect(city.slug).toBe('singapore')
    expect(city.timezone).toBe('Asia/Singapore')
    expect(city.currency).toBe('SGD')
    expect(city.neighborhoods.map((n) => n.name)).toContain('East Coast')
  })

  it('builds a UTC timestamp from a Bangkok local date and time', () => {
    const utcDate = getUtcDateForLocalDateTime('2026-05-06', 7, 30, 'Asia/Bangkok')

    expect(utcDate?.toISOString()).toBe('2026-05-06T00:30:00.000Z')
  })

  it('builds a UTC date range from a Bangkok local date', () => {
    const range = getUtcDateRangeForLocalDate('2026-05-06', 'Asia/Bangkok')

    expect(range?.start.toISOString()).toBe('2026-05-05T17:00:00.000Z')
    expect(range?.end.toISOString()).toBe('2026-05-06T17:00:00.000Z')
  })

  it('maps profile location text to city config without matching partial country codes', () => {
    expect(getCityLocationConfigFromText('Bangkok, Thailand')?.slug).toBe('bangkok')
    expect(getCityLocationConfigFromText('North Pole')?.slug).toBeUndefined()
    expect(getCityLocationConfigFromText('Kings Road')?.slug).toBeUndefined()
    expect(getCityLocationConfigFromText('SG')?.slug).toBe('singapore')
    expect(getCityLocationConfigFromText('BKK')?.slug).toBe('bangkok')
  })

  it('prefers explicit location text before nearby coordinates', () => {
    const city = getCityLocationConfigForPointOrText(
      { lat: 1.3521, lng: 103.8198 },
      'Sukhumvit, Bangkok',
    )

    expect(city.slug).toBe('bangkok')
  })

  it('checks whether coordinates belong to the requested city radius', () => {
    const bangkok = getCityLocationConfigFromText('Bangkok, Thailand')
    expect(bangkok).not.toBeNull()

    expect(isPointInsideCityDetectionRadius(bangkok!, { lat: 13.7563, lng: 100.5018 })).toBe(true)
    expect(isPointInsideCityDetectionRadius(bangkok!, { lat: 1.3521, lng: 103.8198 })).toBe(false)
  })
})
