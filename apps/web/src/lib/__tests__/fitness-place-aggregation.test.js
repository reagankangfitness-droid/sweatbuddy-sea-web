const {
  classifyOsmFitnessPlace,
  isLikelyDuplicate,
  normalizeName,
  slugify,
} = require('../fitness-place-aggregation')

describe('fitness place aggregation', () => {
  it('classifies OSM fitness centres as gyms with strength context', () => {
    const result = classifyOsmFitnessPlace({
      type: 'node',
      id: 123,
      lat: 1.302,
      lon: 103.84,
      tags: {
        name: 'Example Strength Gym',
        leisure: 'fitness_centre',
        website: 'https://example.test',
        opening_hours: 'Mo-Fr 07:00-22:00',
        'addr:suburb': 'Orchard',
      },
    })

    expect(result.placeType).toBe('GYM')
    expect(result.activities).toContain('strength')
    expect(result.area).toBe('Orchard')
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80)
  })

  it('classifies studios from name and sport tags', () => {
    const result = classifyOsmFitnessPlace({
      type: 'way',
      id: 456,
      center: { lat: 1.31, lon: 103.9 },
      tags: {
        name: 'East Reformer Pilates',
        sport: 'yoga',
      },
    })

    expect(result.placeType).toBe('STUDIO')
    expect(result.activities).toContain('pilates')
    expect(result.activities).toContain('yoga')
    expect(result.beginnerFriendly).toBe(true)
  })

  it('classifies public fitness stations as outdoor fitness', () => {
    const result = classifyOsmFitnessPlace({
      type: 'node',
      id: 789,
      lat: 1.35,
      lon: 103.85,
      tags: {
        name: 'Bishan Fitness Corner',
        leisure: 'fitness_station',
        access: 'public',
        fee: 'no',
      },
    })

    expect(result.placeType).toBe('OUTDOOR_FITNESS')
    expect(result.activities).toEqual(expect.arrayContaining(['calisthenics', 'outdoor_fitness']))
    expect(result.vibeTags).toEqual(expect.arrayContaining(['outdoor', 'free']))
    expect(result.dropInFriendly).toBe(true)
  })

  it('keeps spa and recovery places out of the gym bucket', () => {
    const result = classifyOsmFitnessPlace({
      type: 'node',
      id: 321,
      lat: 1.29,
      lon: 103.85,
      tags: {
        name: 'Sawadee Resort Thai Spa',
        leisure: 'fitness_centre',
        website: 'https://example.test',
      },
    })

    expect(result.placeType).toBe('WELLNESS')
    expect(result.activities).toContain('recovery')
    expect(result.activities).not.toContain('strength')
  })

  it('does not treat spa as a substring inside sports venue names', () => {
    const result = classifyOsmFitnessPlace({
      type: 'node',
      id: 322,
      lat: 1.3,
      lon: 103.86,
      tags: {
        name: 'Spartans Boxing Club',
        leisure: 'fitness_centre',
        sport: 'boxing',
      },
    })

    expect(result.placeType).not.toBe('WELLNESS')
    expect(result.activities).toContain('boxing')
    expect(result.activities).not.toContain('recovery')
    expect(result.bestFor).toMatch(/boxing/i)
  })

  it('extracts safe public image tags from OSM records', () => {
    const result = classifyOsmFitnessPlace({
      type: 'node',
      id: 323,
      lat: 1.3,
      lon: 103.86,
      tags: {
        name: 'Photo Ready Gym',
        leisure: 'fitness_centre',
        image: 'https://example.test/gym.jpg',
        wikimedia_commons: 'File:Example gym.webp',
      },
    })

    expect(result.photos).toEqual([
      'https://example.test/gym.jpg',
      'https://commons.wikimedia.org/wiki/Special:FilePath/Example%20gym.webp',
    ])
  })

  it('prefers English OSM names and keeps normalized names non-empty', () => {
    const result = classifyOsmFitnessPlace({
      type: 'way',
      id: 654,
      center: { lat: 1.46, lon: 103.77 },
      tags: {
        name: '足球場',
        'name:en': 'Foon Yew High School Field',
        leisure: 'pitch',
        sport: 'soccer',
      },
    })

    expect(result.name).toBe('Foon Yew High School Field')
    expect(result.normalizedName).toBe('foon yew high school field')
  })

  it('normalizes names, slugs, and duplicate candidates', () => {
    expect(normalizeName('ABC Fitness & Gym!')).toBe('abc fitness and gym')
    expect(slugify('ABC Fitness & Gym!')).toBe('abc-fitness-and-gym')

    const candidate = {
      name: 'ABC Fitness Gym',
      area: 'CBD',
      latitude: 1.28,
      longitude: 103.85,
      sourceId: 'node/1',
    }
    const place = {
      name: 'ABC Fitness Gym',
      area: 'CBD',
      latitude: 1.2805,
      longitude: 103.8505,
    }

    expect(isLikelyDuplicate(candidate, place)).toBe(true)
  })
})
