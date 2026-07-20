export type FitnessPlaceType =
  | 'gym'
  | 'studio'
  | 'outdoor_fitness'
  | 'sports_facility'
  | 'wellness'
  | 'community_space'

export type FitnessDirectoryCategorySlug =
  | 'fitness'
  | 'gyms'
  | 'studios'
  | 'run-clubs'
  | 'outdoor-fitness'
  | 'sports'

import {
  compareListingsBySocialUsefulness,
  getListingPositioning,
  type ListingPositioning,
} from '@/lib/listing-positioning'

export interface FitnessPlaceReviewHighlight {
  rating: number
  title: string
  quote: string
  tags: string[]
}

export interface FitnessPlace {
  slug: string
  name: string
  placeType: FitnessPlaceType
  area: string
  address: string
  city: string
  latitude: number
  longitude: number
  description: string
  coverImage: string
  photos: string[]
  activities: string[]
  amenities: string[]
  vibeTags: string[]
  communityTypes: string[]
  priceSummary: string
  trialSummary: string
  bestFor: string
  bestTimes: string
  dropInFriendly: boolean
  beginnerFriendly: boolean
  socialScore: number
  averageRating: number
  reviewCount: number
  googleRating?: number | null
  googleReviewCount?: number
  googleMapsUrl?: string | null
  trustScore?: number
  photoQualityScore?: number
  reviewSentimentScore?: number
  aiSummary?: string | null
  aiPros?: string[]
  aiCons?: string[]
  intelligenceStatus?: string | null
  lastEnrichedAt?: string | null
  openingHours?: string[]
  placeTypes?: string[]
  websiteUrl?: string | null
  sourceUrl?: string | null
  sourceProvider?: string | null
  lastVerifiedAt?: string | null
  reviewHighlights: FitnessPlaceReviewHighlight[]
  relatedCommunities: Array<{
    name: string
    href: string
    relationship: string
  }>
}

export interface FitnessDirectoryCategory {
  slug: FitnessDirectoryCategorySlug
  title: string
  shortTitle: string
  description: string
  href: string
  placeTypes: FitnessPlaceType[]
  activitySlugs: string[]
  searchIntent: string
}

export const fitnessDirectoryCategories: FitnessDirectoryCategory[] = [
  {
    slug: 'fitness',
    title: 'Fitness in Singapore',
    shortTitle: 'All',
    description: 'The best places, crews, and plans for showing up socially.',
    href: '/singapore',
    placeTypes: ['gym', 'studio', 'outdoor_fitness', 'sports_facility', 'wellness', 'community_space'],
    activitySlugs: [],
    searchIntent: 'Find where to show up, who it suits, and the easiest path to join.',
  },
  {
    slug: 'gyms',
    title: 'Strength and Fight Training in Singapore',
    shortTitle: 'Strength',
    description: 'Strength, fight, HIIT, Hyrox, and functional spaces with a group or drop-in path.',
    href: '/singapore/gyms',
    placeTypes: ['gym'],
    activitySlugs: ['strength', 'hyrox', 'crossfit', 'boxing', 'muay-thai'],
    searchIntent: 'Find training spaces that are easier to enter than a generic gym listing.',
  },
  {
    slug: 'studios',
    title: 'Yoga, Pilates, and Recovery in Singapore',
    shortTitle: 'Soft Entry',
    description: 'Yoga, Pilates, mobility, breathwork, and recovery with first-timer context.',
    href: '/singapore/studios',
    placeTypes: ['studio', 'wellness'],
    activitySlugs: ['pilates', 'yoga', 'spin', 'barre', 'mobility', 'dance'],
    searchIntent: 'Find low-pressure ways to move, recover, and meet regulars.',
  },
  {
    slug: 'run-clubs',
    title: 'Run and Walk Clubs in Singapore',
    shortTitle: 'Run / Walk',
    description: 'Social runs, walks, regular meeting points, and beginner-friendly crews.',
    href: '/singapore/run-clubs',
    placeTypes: ['community_space', 'outdoor_fitness'],
    activitySlugs: ['running', 'run_club', 'trail_running', 'walking'],
    searchIntent: 'Find routes and meeting spots with people you can actually join.',
  },
  {
    slug: 'outdoor-fitness',
    title: 'Outdoor Training in Singapore',
    shortTitle: 'Outdoor',
    description: 'Park workouts, calisthenics zones, waterfront circuits, and open-air groups.',
    href: '/singapore/outdoor-fitness',
    placeTypes: ['outdoor_fitness', 'community_space'],
    activitySlugs: ['outdoor_fitness', 'calisthenics', 'bootcamp', 'running'],
    searchIntent: 'Find free or low-friction places for solo training and group sessions.',
  },
  {
    slug: 'sports',
    title: 'Social Sports in Singapore',
    shortTitle: 'Social Sports',
    description: 'Courts, fields, pools, climbing spaces, and pickup-friendly meeting points.',
    href: '/singapore/sports',
    placeTypes: ['sports_facility'],
    activitySlugs: ['pickleball', 'tennis', 'badminton', 'basketball', 'swimming', 'climbing'],
    searchIntent: 'Find places to play where partners, pickup games, or groups make joining easier.',
  },
]

export const singaporeFitnessPlaces: FitnessPlace[] = [
  {
    slug: 'cbd-strength-gym',
    name: 'CBD Strength Gym',
    placeType: 'gym',
    area: 'Tanjong Pagar',
    address: 'Tanjong Pagar, Singapore',
    city: 'Singapore',
    latitude: 1.2765,
    longitude: 103.8457,
    description:
      'A central strength and conditioning space for lifters, Hyrox prep, and after-work training sessions.',
    coverImage: '/banner/athletics.jpg',
    photos: ['/banner/athletics.jpg', '/images/connect-people.webp', '/images/hosts/caliversity.jpg'],
    activities: ['strength', 'hyrox', 'functional', 'calisthenics'],
    amenities: ['Showers', 'Lockers', 'Free weights', 'Functional zone'],
    vibeTags: ['after-work', 'serious-training', 'solo-friendly', 'structured'],
    communityTypes: ['Hyrox crews', 'office athletes', 'small-group strength'],
    priceSummary: 'Membership and drop-in options',
    trialSummary: 'Trial class likely best for first visit',
    bestFor: 'Strength training, Hyrox prep, and compact post-work sessions.',
    bestTimes: 'Weekday evenings and Saturday mornings',
    dropInFriendly: true,
    beginnerFriendly: false,
    socialScore: 74,
    averageRating: 4.6,
    reviewCount: 38,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Good training density',
        quote: 'Best when you already know what you want to train.',
        tags: ['equipment', 'serious-training'],
      },
      {
        rating: 4,
        title: 'Easy after work',
        quote: 'Convenient for CBD workers, but peak hours fill fast.',
        tags: ['location', 'busy'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Hyrox training crews',
        href: '/communities?category=hyrox',
        relationship: 'Members use it for weekday conditioning blocks.',
      },
    ],
  },
  {
    slug: 'farrer-park-fight-gym',
    name: 'Farrer Park Fight Gym',
    placeType: 'gym',
    area: 'Farrer Park',
    address: 'Farrer Park, Singapore',
    city: 'Singapore',
    latitude: 1.3127,
    longitude: 103.8543,
    description:
      'A combat-sports focused gym with striking classes, conditioning, and a mixed beginner-to-competitive crowd.',
    coverImage: '/images/hero-3.jpg',
    photos: ['/images/hero-3.jpg', '/banner/athletics.jpg'],
    activities: ['boxing', 'muay-thai', 'strength', 'hiit'],
    amenities: ['Bag area', 'Gloves rental', 'Showers', 'Conditioning zone'],
    vibeTags: ['high-energy', 'skill-building', 'beginner-aware', 'competitive'],
    communityTypes: ['fight sport beginners', 'sparring groups', 'conditioning crews'],
    priceSummary: 'Class packs and memberships',
    trialSummary: 'Intro class recommended',
    bestFor: 'Boxing, Muay Thai basics, and high-intensity conditioning.',
    bestTimes: 'Weeknights and Sunday afternoons',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 81,
    averageRating: 4.7,
    reviewCount: 44,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Welcoming first session',
        quote: 'Coaches split beginners and experienced people well.',
        tags: ['beginner-friendly', 'coaching'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Combat fitness groups',
        href: '/communities?category=boxing',
        relationship: 'Good fit for people who want a skill-based crew.',
      },
    ],
  },
  {
    slug: 'orchard-reformer-studio',
    name: 'Orchard Reformer Studio',
    placeType: 'studio',
    area: 'Orchard',
    address: 'Orchard, Singapore',
    city: 'Singapore',
    latitude: 1.3048,
    longitude: 103.8318,
    description:
      'A polished reformer studio with small classes, attentive instruction, and predictable central access.',
    coverImage: '/images/hero/meditation.png',
    photos: ['/images/hero/meditation.png', '/images/hero-bg.jpg'],
    activities: ['pilates', 'mobility', 'stretching'],
    amenities: ['Reformer beds', 'Grip socks retail', 'Changing rooms', 'Water station'],
    vibeTags: ['polished', 'low-impact', 'beginner-friendly', 'small-class'],
    communityTypes: ['pilates regulars', 'low-impact training', 'women-led sessions'],
    priceSummary: 'Premium class packs',
    trialSummary: 'Starter pack available in most studio formats',
    bestFor: 'Reformer beginners, posture work, and low-impact strength.',
    bestTimes: 'Mid-morning, lunch, and early evening',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 68,
    averageRating: 4.8,
    reviewCount: 52,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Clear instruction',
        quote: 'Small classes make it easier to ask for form corrections.',
        tags: ['coaching', 'beginner-friendly'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Pilates and mobility groups',
        href: '/communities?category=pilates',
        relationship: 'Useful entry point for people who want consistent classmates.',
      },
    ],
  },
  {
    slug: 'joo-chiat-yoga-loft',
    name: 'Joo Chiat Yoga Loft',
    placeType: 'studio',
    area: 'Joo Chiat',
    address: 'Joo Chiat, Singapore',
    city: 'Singapore',
    latitude: 1.3117,
    longitude: 103.9021,
    description:
      'A neighborhood yoga studio with slower classes, community energy, and easy post-class cafe options.',
    coverImage: '/images/hero-bg.jpg',
    photos: ['/images/hero-bg.jpg', '/images/community-bonds.jpg'],
    activities: ['yoga', 'meditation', 'breathwork', 'stretching'],
    amenities: ['Mats', 'Props', 'Changing rooms', 'Nearby cafes'],
    vibeTags: ['neighborhood', 'calm', 'social-after', 'beginner-friendly'],
    communityTypes: ['yoga regulars', 'wellness circles', 'new-to-area groups'],
    priceSummary: 'Class packs and memberships',
    trialSummary: 'Beginner class is the cleanest entry',
    bestFor: 'Slow flow, meeting neighborhood regulars, and recovery days.',
    bestTimes: 'Weekend mornings and weekday evenings',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 79,
    averageRating: 4.7,
    reviewCount: 31,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Neighborhood feel',
        quote: 'People actually chat after class instead of leaving immediately.',
        tags: ['social', 'neighborhood'],
      },
    ],
    relatedCommunities: [
      {
        name: 'East side wellness crews',
        href: '/communities?area=Joo%20Chiat',
        relationship: 'Often pairs with coffee, walks, and low-intensity meetups.',
      },
    ],
  },
  {
    slug: 'marina-bay-run-loop',
    name: 'Marina Bay Run Loop',
    placeType: 'community_space',
    area: 'Marina Bay',
    address: 'Marina Bay, Singapore',
    city: 'Singapore',
    latitude: 1.2834,
    longitude: 103.8607,
    description:
      'A highly visible waterfront route used by social run crews, beginner 5K groups, and office runners.',
    coverImage: '/banner/running.jpg',
    photos: ['/banner/running.jpg', '/images/hosts/run-club-group.jpg'],
    activities: ['running', 'run_club', 'walking', 'intervals'],
    amenities: ['Waterfront route', 'Public transport nearby', 'Photo spots', 'Post-run food'],
    vibeTags: ['social', 'scenic', 'beginner-friendly', 'after-work'],
    communityTypes: ['run clubs', 'newcomer groups', 'corporate wellness runs'],
    priceSummary: 'Mostly free community use',
    trialSummary: 'Join a social run before trying intervals',
    bestFor: 'First run club session, 5K loops, and social after-work movement.',
    bestTimes: 'Tuesday to Thursday evenings and Sunday mornings',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 93,
    averageRating: 4.9,
    reviewCount: 86,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Best first run route',
        quote: 'Easy to find the group and easy to leave if the pace is wrong.',
        tags: ['run-club', 'beginner-friendly'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Singapore run clubs',
        href: '/communities?category=running',
        relationship: 'Common meeting route for social and pace-based crews.',
      },
    ],
  },
  {
    slug: 'east-coast-outdoor-fitness',
    name: 'East Coast Outdoor Fitness',
    placeType: 'outdoor_fitness',
    area: 'East Coast',
    address: 'East Coast Park, Singapore',
    city: 'Singapore',
    latitude: 1.3008,
    longitude: 103.9122,
    description:
      'A beachside training area for bootcamps, bodyweight workouts, runs, and casual weekend sports.',
    coverImage: '/images/community-bonds.jpg',
    photos: ['/images/community-bonds.jpg', '/images/hero/run-club.jpg'],
    activities: ['outdoor_fitness', 'bootcamp', 'running', 'beach_workout'],
    amenities: ['Open space', 'Public toilets', 'Coastal route', 'Food nearby'],
    vibeTags: ['outdoor', 'weekend', 'group-friendly', 'casual'],
    communityTypes: ['bootcamp groups', 'run crews', 'beach workout groups'],
    priceSummary: 'Free space, paid classes vary',
    trialSummary: 'Message hosts before showing up to paid groups',
    bestFor: 'Weekend bootcamps, easy runs, and casual group training.',
    bestTimes: 'Saturday mornings and sunset sessions',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 88,
    averageRating: 4.6,
    reviewCount: 61,
    reviewHighlights: [
      {
        rating: 4,
        title: 'Great group energy',
        quote: 'Best with a crew because the area is spread out.',
        tags: ['outdoor', 'group-friendly'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Outdoor bootcamp hosts',
        href: '/communities?category=bootcamp',
        relationship: 'Several community-led sessions fit this format.',
      },
    ],
  },
  {
    slug: 'bishan-active-park',
    name: 'Bishan Active Park',
    placeType: 'outdoor_fitness',
    area: 'Bishan',
    address: 'Bishan, Singapore',
    city: 'Singapore',
    latitude: 1.3526,
    longitude: 103.8499,
    description:
      'A central outdoor option for calisthenics, casual circuits, and low-pressure neighborhood workouts.',
    coverImage: '/images/cities/singapore.jpg',
    photos: ['/images/cities/singapore.jpg', '/images/connect-people.webp'],
    activities: ['calisthenics', 'outdoor_fitness', 'running', 'walking'],
    amenities: ['Public park', 'Outdoor equipment', 'Open lawns', 'Transit access'],
    vibeTags: ['neighborhood', 'solo-friendly', 'free', 'low-pressure'],
    communityTypes: ['calisthenics crews', 'walking groups', 'beginner outdoor fitness'],
    priceSummary: 'Free public access',
    trialSummary: 'Good for solo scouting before joining a group',
    bestFor: 'Bodyweight training, beginner outdoor movement, and central meetups.',
    bestTimes: 'Early mornings and evenings',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 72,
    averageRating: 4.4,
    reviewCount: 24,
    reviewHighlights: [
      {
        rating: 4,
        title: 'Easy to start',
        quote: 'Good place to try calisthenics without committing to a gym.',
        tags: ['free', 'beginner-friendly'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Calisthenics groups',
        href: '/communities?category=calisthenics',
        relationship: 'A natural spot for bodyweight skill practice.',
      },
    ],
  },
  {
    slug: 'kallang-court-hub',
    name: 'Kallang Court Hub',
    placeType: 'sports_facility',
    area: 'Kallang',
    address: 'Kallang, Singapore',
    city: 'Singapore',
    latitude: 1.304,
    longitude: 103.8764,
    description:
      'A sports facility zone for court bookings, social games, and groups looking for central access.',
    coverImage: '/images/organizers-bg.jpg',
    photos: ['/images/organizers-bg.jpg', '/images/community-bonds.jpg'],
    activities: ['pickleball', 'tennis', 'badminton', 'basketball'],
    amenities: ['Courts', 'Booking required', 'Public transport nearby', 'Changing areas'],
    vibeTags: ['social-sports', 'booking-needed', 'mixed-levels', 'central'],
    communityTypes: ['pickleball groups', 'pickup games', 'corporate sports'],
    priceSummary: 'Court booking fees vary',
    trialSummary: 'Join a hosted session before booking your own court',
    bestFor: 'Trying a sport socially before forming your own group.',
    bestTimes: 'Weeknights and weekend afternoons',
    dropInFriendly: false,
    beginnerFriendly: true,
    socialScore: 86,
    averageRating: 4.5,
    reviewCount: 47,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Good for social sports',
        quote: 'Hosted games make it less awkward than showing up alone.',
        tags: ['social-sports', 'hosted'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Pickleball crews',
        href: '/communities?category=pickleball',
        relationship: 'Best discovered through hosted beginner sessions.',
      },
    ],
  },
  {
    slug: 'queenstown-swim-complex',
    name: 'Queenstown Swim Complex',
    placeType: 'sports_facility',
    area: 'Queenstown',
    address: 'Queenstown, Singapore',
    city: 'Singapore',
    latitude: 1.2942,
    longitude: 103.8059,
    description:
      'A pool-focused training option for lane swims, beginner technique groups, and triathlon prep.',
    coverImage: '/images/hero-2.jpg',
    photos: ['/images/hero-2.jpg', '/images/cities/singapore.jpg'],
    activities: ['swimming', 'triathlon', 'recovery'],
    amenities: ['Pool', 'Showers', 'Lockers', 'Public access'],
    vibeTags: ['structured', 'solo-friendly', 'technique', 'low-impact'],
    communityTypes: ['swim squads', 'triathlon groups', 'beginner technique classes'],
    priceSummary: 'Entry and coaching fees vary',
    trialSummary: 'Start with a technique group if returning to swimming',
    bestFor: 'Lane swimming, triathlon base work, and low-impact cardio.',
    bestTimes: 'Early mornings and off-peak afternoons',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 63,
    averageRating: 4.3,
    reviewCount: 29,
    reviewHighlights: [
      {
        rating: 4,
        title: 'Better with a squad',
        quote: 'Solo swims are fine, but coaching groups make progress clearer.',
        tags: ['swimming', 'coaching'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Swim and triathlon groups',
        href: '/communities?category=swimming',
        relationship: 'Useful for technique accountability and pacing.',
      },
    ],
  },
  {
    slug: 'holland-village-climbing-wall',
    name: 'Holland Village Climbing Wall',
    placeType: 'sports_facility',
    area: 'Holland Village',
    address: 'Holland Village, Singapore',
    city: 'Singapore',
    latitude: 1.311,
    longitude: 103.7965,
    description:
      'A climbing-focused sports space where first-timers can learn basics and regulars can meet partners.',
    coverImage: '/images/hero-1.webp',
    photos: ['/images/hero-1.webp', '/images/connect-people.webp'],
    activities: ['climbing', 'strength', 'mobility'],
    amenities: ['Climbing walls', 'Shoe rental', 'Crash mats', 'Beginner routes'],
    vibeTags: ['partner-friendly', 'skill-building', 'social', 'beginner-friendly'],
    communityTypes: ['bouldering groups', 'climbing partners', 'skill clinics'],
    priceSummary: 'Day passes and class packs',
    trialSummary: 'Beginner intro session recommended',
    bestFor: 'Learning bouldering basics and finding regular climbing partners.',
    bestTimes: 'Weeknights after work',
    dropInFriendly: true,
    beginnerFriendly: true,
    socialScore: 84,
    averageRating: 4.7,
    reviewCount: 33,
    reviewHighlights: [
      {
        rating: 5,
        title: 'Easy to meet partners',
        quote: 'People naturally talk about routes, which makes it social.',
        tags: ['social', 'skill-building'],
      },
    ],
    relatedCommunities: [
      {
        name: 'Climbing groups',
        href: '/communities?category=climbing',
        relationship: 'Good match for recurring skill nights and partner-finding.',
      },
    ],
  },
]

export function getDirectoryCategory(slug?: string | null): FitnessDirectoryCategory {
  return (
    fitnessDirectoryCategories.find((category) => category.slug === slug) ??
    fitnessDirectoryCategories[0]
  )
}

export function isDirectoryCategorySlug(value: string): value is FitnessDirectoryCategorySlug {
  return fitnessDirectoryCategories.some((category) => category.slug === value)
}

export function formatPlaceType(type: FitnessPlaceType): string {
  const labels: Record<FitnessPlaceType, string> = {
    gym: 'Gym',
    studio: 'Studio',
    outdoor_fitness: 'Outdoor fitness',
    sports_facility: 'Sports facility',
    wellness: 'Wellness',
    community_space: 'Community space',
  }

  return labels[type]
}

export function getPlaceBySlug(slug: string): FitnessPlace | undefined {
  return singaporeFitnessPlaces.find((place) => place.slug === slug)
}

export function getFitnessPlacesForCategory(
  categorySlug: FitnessDirectoryCategorySlug,
  options: { query?: string; area?: string; vibe?: string; beginner?: boolean; includeGeneric?: boolean } = {},
  places: FitnessPlace[] = singaporeFitnessPlaces,
): FitnessPlace[] {
  const category = getDirectoryCategory(categorySlug)
  const query = options.query?.trim().toLowerCase()
  const hasSpecificFilter = Boolean(query || options.area || options.vibe || options.beginner || options.includeGeneric)

  return places
    .filter((place) => {
      const typeMatch = category.placeTypes.includes(place.placeType)
      const activityMatch =
        category.activitySlugs.length === 0 ||
        place.activities.some((activity) => category.activitySlugs.includes(activity))

      if (['gyms', 'studios', 'sports'].includes(category.slug)) {
        return typeMatch
      }

      return typeMatch || activityMatch
    })
    .filter((place) => {
      if (hasSpecificFilter) return true
      return getListingPositioning(place).publicPriority !== 'Hidden'
    })
    .filter((place) => {
      if (!query) return true
      const haystack = [
        place.name,
        place.description,
        place.area,
        place.address,
        place.bestFor,
        place.placeType,
        ...place.activities,
        ...place.amenities,
        ...place.vibeTags,
        ...place.communityTypes,
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
    .filter((place) => (options.area ? place.area === options.area : true))
    .filter((place) => (options.vibe ? place.vibeTags.includes(options.vibe) : true))
    .filter((place) => (options.beginner ? place.beginnerFriendly : true))
    .sort(compareListingsBySocialUsefulness)
}

export function getFitnessPlacePositioning(place: FitnessPlace): ListingPositioning {
  return getListingPositioning(place)
}

export function getDirectoryAreas(places: FitnessPlace[] = singaporeFitnessPlaces): string[] {
  return [...new Set(places.map((place) => place.area))].sort((a, b) => a.localeCompare(b))
}

export function getDirectoryVibes(places: FitnessPlace[] = singaporeFitnessPlaces): string[] {
  const counts = new Map<string, number>()
  for (const place of places) {
    for (const tag of place.vibeTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag)
}

export function humanizeDirectoryTag(value: string): string {
  return value.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function getDirectoryStats(places: FitnessPlace[] = singaporeFitnessPlaces) {
  return {
    places: places.length,
    activities: new Set(places.flatMap((place) => place.activities)).size,
    areas: new Set(places.map((place) => place.area)).size,
    socialPlaces: places.filter((place) => getListingPositioning(place).socialSignal !== 'None').length,
  }
}
