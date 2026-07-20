import { describe, expect, it } from 'vitest'
import {
  getDirectoryAreas,
  getDirectoryCategory,
  getDirectoryStats,
  getDirectoryVibes,
  getFitnessPlacesForCategory,
  getPlaceBySlug,
  humanizeDirectoryTag,
  isDirectoryCategorySlug,
} from '@/lib/fitness-directory'

describe('fitness directory', () => {
  it('resolves unknown category slugs to the city guide default', () => {
    expect(getDirectoryCategory('unknown').slug).toBe('fitness')
    expect(isDirectoryCategorySlug('sports')).toBe(true)
    expect(isDirectoryCategorySlug('unknown')).toBe(false)
  })

  it('filters places by category and search query', () => {
    const gyms = getFitnessPlacesForCategory('gyms')
    expect(gyms.length).toBeGreaterThan(0)
    expect(gyms.every((place) => place.placeType === 'gym')).toBe(true)

    const pilates = getFitnessPlacesForCategory('studios', { query: 'pilates' })
    expect(pilates.map((place) => place.slug)).toContain('orchard-reformer-studio')
  })

  it('applies area, vibe, and beginner filters together', () => {
    const places = getFitnessPlacesForCategory('fitness', {
      area: 'Marina Bay',
      vibe: 'beginner-friendly',
      beginner: true,
    })

    expect(places.map((place) => place.slug)).toEqual(['marina-bay-run-loop'])
  })

  it('returns directory facets and stats', () => {
    expect(getDirectoryAreas()).toContain('Tanjong Pagar')
    expect(getDirectoryVibes()).toContain('beginner-friendly')
    expect(getDirectoryStats().places).toBeGreaterThan(5)
    expect(humanizeDirectoryTag('social-sports')).toBe('Social Sports')
  })

  it('finds detail pages by slug', () => {
    expect(getPlaceBySlug('kallang-court-hub')?.activities).toContain('pickleball')
    expect(getPlaceBySlug('missing-place')).toBeUndefined()
  })
})
