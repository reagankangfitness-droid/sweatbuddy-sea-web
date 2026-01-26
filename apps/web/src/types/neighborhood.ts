export interface Neighborhood {
  id: string
  name: string
  shortName: string
  coordinates: {
    lat: number
    lng: number
  }
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  mapPosition: {
    top: string
    left: string
  }
  popularVenues: string[]
  vibe: 'chill' | 'moderate' | 'intense'
  description: string
}

export interface NeighborhoodOverview extends Neighborhood {
  eventCount: number
  attendeeCount: number
  isHot: boolean
  nextEvent?: {
    title: string
    datetime: string
  }
}

export interface MapOverviewResponse {
  success: boolean
  data: {
    neighborhoods: NeighborhoodOverview[]
    summary: {
      totalEvents: number
      totalAttendees: number
      hotSpot: {
        id: string
        name: string
      } | null
    }
    timeRange: string
  }
}

export interface NeighborhoodEventsResponse {
  success: boolean
  data: {
    neighborhood: {
      id: string
      name: string
      vibe: 'chill' | 'moderate' | 'intense'
      description: string
    }
    events: NeighborhoodEvent[]
    pagination: {
      hasMore: boolean
      cursor: string | null
    }
  }
}

export interface NeighborhoodEvent {
  id: string
  slug: string
  title: string
  host: {
    id: string
    name: string
    handle: string
    avatar?: string
  }
  datetime: string
  category: string
  image?: string
  price: number | null
  isRecurring: boolean
  location: {
    name: string
  }
  attendeeCount: number
  capacity?: number
  attendeeAvatars: {
    initial: string
    color: string
  }[]
}
