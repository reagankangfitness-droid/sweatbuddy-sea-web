const DEFAULT_CITY = 'Singapore'

const SPORT_ACTIVITY_MAP = {
  badminton: 'badminton',
  basketball: 'basketball',
  climbing: 'climbing',
  fitness: 'strength',
  martial_arts: 'martial_arts',
  padel: 'padel',
  pickleball: 'pickleball',
  running: 'running',
  soccer: 'soccer',
  swimming: 'swimming',
  table_tennis: 'table_tennis',
  tennis: 'tennis',
  yoga: 'yoga',
}

const ACTIVITY_KEYWORDS = [
  ['pilates', 'pilates'],
  ['reformer', 'pilates'],
  ['yoga', 'yoga'],
  ['crossfit', 'crossfit'],
  ['hyrox', 'hyrox'],
  ['boxing', 'boxing'],
  ['muay thai', 'muay_thai'],
  ['mma', 'martial_arts'],
  ['boulder', 'climbing'],
  ['climb', 'climbing'],
  ['swim', 'swimming'],
  ['tennis', 'tennis'],
  ['badminton', 'badminton'],
  ['pickleball', 'pickleball'],
  ['padel', 'padel'],
  ['basketball', 'basketball'],
  ['football', 'soccer'],
  ['soccer', 'soccer'],
  ['calisthenics', 'calisthenics'],
  ['bootcamp', 'bootcamp'],
  ['dance', 'dance'],
  ['spin', 'cycling'],
  ['cycling', 'cycling'],
  ['spa', 'recovery'],
  ['sauna', 'sauna'],
  ['bath', 'recovery'],
  ['recovery', 'recovery'],
  ['physio', 'recovery'],
  ['gym', 'strength'],
  ['fitness', 'strength'],
  ['strength', 'strength'],
]

function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function slugify(value) {
  return normalizeName(value).replace(/\s+/g, '-').replace(/^-+|-+$/g, '')
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== ''))
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function keywordMatches(text, keyword) {
  if (keyword.length <= 4 || keyword.includes(' ')) {
    return new RegExp(`\\b${escapeRegExp(keyword)}\\b`).test(text)
  }
  return text.includes(keyword)
}

function sourceIdForOsmElement(element) {
  return `${element.type}/${element.id}`
}

function sourceUrlForOsmElement(element) {
  return `https://www.openstreetmap.org/${element.type}/${element.id}`
}

function coordinatesForOsmElement(element) {
  return {
    latitude: typeof element.lat === 'number' ? element.lat : element.center?.lat ?? null,
    longitude: typeof element.lon === 'number' ? element.lon : element.center?.lon ?? null,
  }
}

function addressFromTags(tags) {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:unit'],
    tags['addr:city'],
    tags['addr:postcode'],
  ].filter(Boolean).join(', ') || null
}

function areaFromTags(tags) {
  return tags['addr:suburb'] || tags['addr:neighbourhood'] || tags['addr:city'] || null
}

function inferActivities(tags, name) {
  const text = [
    name,
    tags.sport,
    tags.leisure,
    tags.amenity,
    tags.club,
    tags.description,
    tags['operator:type'],
  ].filter(Boolean).join(' ').toLowerCase()

  const activities = []
  for (const sport of String(tags.sport || '').split(';')) {
    const mapped = SPORT_ACTIVITY_MAP[sport.trim().toLowerCase()]
    if (mapped) activities.push(mapped)
  }

  for (const [keyword, activity] of ACTIVITY_KEYWORDS) {
    if (keywordMatches(text, keyword)) activities.push(activity)
  }

  if (tags.leisure === 'fitness_centre' || tags.amenity === 'gym') activities.push('strength')
  if (tags.leisure === 'fitness_station') activities.push('calisthenics', 'outdoor_fitness')
  if (tags.leisure === 'swimming_pool') activities.push('swimming')
  if (tags.leisure === 'sports_centre' && activities.length === 0) activities.push('sports')
  if (tags.leisure === 'track') activities.push('running')

  return unique(activities)
}

function inferPlaceType(tags, activities, name) {
  const text = `${name} ${tags.amenity || ''} ${tags.leisure || ''} ${tags.sport || ''}`.toLowerCase()

  if (/\b(spa|sauna|bath|recovery|physio|therapy)\b/.test(text) && !/\b(boxing|mma|muay|martial)\b/.test(text)) {
    return 'WELLNESS'
  }
  if (tags.leisure === 'fitness_station') return 'OUTDOOR_FITNESS'
  if (tags.leisure === 'track') return 'OUTDOOR_FITNESS'
  if (text.includes('park') && (activities.includes('running') || activities.includes('calisthenics'))) {
    return 'OUTDOOR_FITNESS'
  }
  if (activities.some((activity) => ['yoga', 'pilates', 'dance', 'cycling'].includes(activity))) {
    return 'STUDIO'
  }
  if (activities.some((activity) => ['swimming', 'tennis', 'badminton', 'pickleball', 'padel', 'basketball', 'soccer', 'climbing', 'table_tennis'].includes(activity))) {
    return 'SPORTS_FACILITY'
  }
  if (tags.amenity === 'dojo' || activities.includes('martial_arts') || activities.includes('boxing') || activities.includes('muay_thai')) {
    return 'GYM'
  }
  if (tags.leisure === 'sports_centre') return 'SPORTS_FACILITY'
  if (tags.leisure === 'fitness_centre' || tags.amenity === 'gym' || activities.includes('strength')) return 'GYM'
  if (tags.amenity === 'spa' || tags.leisure === 'sauna') return 'WELLNESS'

  return 'COMMUNITY_SPACE'
}

function inferAmenities(tags, placeType) {
  const amenities = []
  if (tags.shower === 'yes' || tags.showers === 'yes') amenities.push('Showers')
  if (tags.locker === 'yes' || tags.lockers === 'yes') amenities.push('Lockers')
  if (tags.parking === 'yes') amenities.push('Parking')
  if (tags['wheelchair'] === 'yes') amenities.push('Wheelchair accessible')
  if (tags.leisure === 'swimming_pool') amenities.push('Pool')
  if (tags.leisure === 'fitness_station') amenities.push('Outdoor equipment')
  if (placeType === 'SPORTS_FACILITY') amenities.push('Sports facilities')
  if (placeType === 'OUTDOOR_FITNESS') amenities.push('Outdoor space')
  return unique(amenities)
}

function inferVibeTags(tags, activities, placeType) {
  const tagsOut = []
  if (placeType === 'OUTDOOR_FITNESS') tagsOut.push('outdoor', 'free')
  if (placeType === 'SPORTS_FACILITY') tagsOut.push('social-sports')
  if (placeType === 'STUDIO') tagsOut.push('class-based')
  if (activities.includes('running')) tagsOut.push('beginner-friendly', 'social')
  if (activities.includes('yoga') || activities.includes('pilates')) tagsOut.push('beginner-friendly', 'low-impact')
  if (activities.includes('strength') || activities.includes('crossfit') || activities.includes('hyrox')) tagsOut.push('serious-training')
  if (tags.fee === 'no') tagsOut.push('free')
  if (tags.access === 'public') tagsOut.push('public-access')
  return unique(tagsOut)
}

function inferCommunityTypes(activities, placeType) {
  const types = []
  if (activities.includes('running')) types.push('run clubs')
  if (activities.includes('pilates')) types.push('pilates regulars')
  if (activities.includes('yoga')) types.push('wellness groups')
  if (activities.includes('strength') || activities.includes('hyrox')) types.push('strength crews')
  if (activities.includes('calisthenics')) types.push('calisthenics crews')
  if (placeType === 'SPORTS_FACILITY') types.push('social sports groups')
  if (placeType === 'OUTDOOR_FITNESS') types.push('outdoor workout groups')
  return unique(types)
}

function inferBestFor(activities, placeType) {
  if (activities.includes('pilates')) return 'Pilates classes, low-impact strength, and regular studio training.'
  if (activities.includes('yoga')) return 'Yoga, mobility, mindfulness, and recovery-focused movement.'
  if (activities.includes('sauna') || activities.includes('recovery')) return 'Recovery, heat/cold exposure, and wellness routines.'
  if (activities.includes('running')) return 'Runs, route scouting, and social movement groups.'
  if (activities.includes('climbing')) return 'Climbing sessions, skill practice, and partner-friendly training.'
  if (activities.some((activity) => ['boxing', 'martial_arts'].includes(activity))) {
    return 'Boxing, combat-sport training, conditioning, and skill practice.'
  }
  if (activities.includes('swimming')) return 'Lane swims, technique work, and low-impact cardio.'
  if (activities.some((activity) => ['tennis', 'badminton', 'pickleball', 'padel', 'basketball', 'soccer'].includes(activity))) {
    return 'Social sports, court bookings, and recurring games.'
  }
  if (activities.includes('strength') || activities.includes('crossfit') || activities.includes('hyrox')) {
    return 'Strength training, conditioning, and structured performance work.'
  }
  if (placeType === 'OUTDOOR_FITNESS') return 'Outdoor workouts, bodyweight training, and group sessions.'
  return 'Fitness sessions, community activity, and local training.'
}

function scoreCandidate({ tags, coordinates, activities, placeType, websiteUrl, address }) {
  let score = 35
  if (tags.name) score += 14
  if (coordinates.latitude && coordinates.longitude) score += 14
  if (address) score += 8
  if (websiteUrl) score += 8
  if (activities.length > 0) score += 10
  if (tags.sport || tags.leisure || tags.amenity) score += 8
  if (placeType !== 'COMMUNITY_SPACE') score += 6
  if (tags.opening_hours) score += 4
  if (tags.phone || tags['contact:phone']) score += 3
  return Math.min(100, score)
}

function imageUrlsFromTags(tags) {
  const urls = []
  const directImage = tags.image || tags['contact:image']
  const wikimediaFile = tags.wikimedia_commons || tags['image:commons']

  if (typeof directImage === 'string' && /^https:\/\/.+\.(jpe?g|png|webp)(\?.*)?$/i.test(directImage)) {
    urls.push(directImage)
  }

  if (typeof wikimediaFile === 'string') {
    const fileName = wikimediaFile.replace(/^File:/i, '').trim()
    if (fileName && /\.(jpe?g|png|webp)$/i.test(fileName)) {
      urls.push(`https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}`)
    }
  }

  return unique(urls).slice(0, 3)
}

function classifyOsmFitnessPlace(element, options = {}) {
  const tags = element.tags || {}
  const name = tags['name:en'] || tags.name || tags.brand || tags.operator
  if (!name) return null

  const coordinates = coordinatesForOsmElement(element)
  let activities = inferActivities(tags, name)
  const placeType = inferPlaceType(tags, activities, name)
  if (placeType === 'WELLNESS') {
    activities = unique([...activities.filter((activity) => activity !== 'strength'), 'recovery'])
  }
  const amenities = inferAmenities(tags, placeType)
  const vibeTags = inferVibeTags(tags, activities, placeType)
  const communityTypes = inferCommunityTypes(activities, placeType)
  const websiteUrl = tags.website || tags['contact:website'] || tags.url || null
  const address = addressFromTags(tags)
  const photos = imageUrlsFromTags(tags)
  const confidenceScore = scoreCandidate({
    tags,
    coordinates,
    activities,
    placeType,
    websiteUrl,
    address,
  })

  const sourceId = sourceIdForOsmElement(element)
  const beginnerFriendly = vibeTags.includes('beginner-friendly') || placeType === 'OUTDOOR_FITNESS'
  const dropInFriendly = ['OUTDOOR_FITNESS', 'COMMUNITY_SPACE'].includes(placeType) || tags.access === 'public'

  return compactObject({
    sourceType: 'OSM',
    sourceId,
    sourceUrl: sourceUrlForOsmElement(element),
    name: String(name).trim(),
    normalizedName: normalizeName(name) || String(name).trim().slice(0, 220) || sourceId,
    slug: slugify(`${name} ${options.city || DEFAULT_CITY}`),
    placeType,
    city: options.city || DEFAULT_CITY,
    area: areaFromTags(tags),
    address,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    websiteUrl,
    phone: tags.phone || tags['contact:phone'] || null,
    photos,
    activities,
    amenities,
    vibeTags,
    communityTypes,
    bestFor: inferBestFor(activities, placeType),
    priceSummary: tags.fee === 'no' ? 'Free public access' : null,
    trialSummary: dropInFriendly ? 'Good candidate for drop-in or public access' : 'Check official page before visiting',
    dropInFriendly,
    beginnerFriendly,
    socialScore: Math.min(95, Math.max(45, 50 + communityTypes.length * 8 + (beginnerFriendly ? 8 : 0))),
    confidenceScore,
    sourceTags: tags,
    rawData: element,
  })
}

function haversineKm(a, b) {
  if (!a?.latitude || !a?.longitude || !b?.latitude || !b?.longitude) return Number.POSITIVE_INFINITY
  const radiusKm = 6371
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180
  const lat1 = (a.latitude * Math.PI) / 180
  const lat2 = (b.latitude * Math.PI) / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return radiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

function isLikelyDuplicate(candidate, place) {
  if (!candidate || !place) return false
  if (candidate.sourceId && place.osmElementId === candidate.sourceId) return true
  if (candidate.websiteUrl && place.websiteUrl && candidate.websiteUrl.replace(/\/$/, '') === place.websiteUrl.replace(/\/$/, '')) {
    return true
  }
  const sameName = normalizeName(candidate.name) === normalizeName(place.name)
  if (!sameName) return false
  if (candidate.area && place.area && candidate.area === place.area) return true
  return haversineKm(candidate, place) <= 0.12
}

module.exports = {
  classifyOsmFitnessPlace,
  haversineKm,
  isLikelyDuplicate,
  normalizeName,
  slugify,
}
