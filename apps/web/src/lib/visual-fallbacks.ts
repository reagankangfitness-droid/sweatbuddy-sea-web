export const SESSION_LISTING_IMAGES: Record<string, string> = {
  running: '/banner/running.jpg',
  run: '/banner/running.jpg',
  run_club: '/banner/run-club.jpg',
  trail_running: '/banner/running.jpg',
  yoga: '/images/hero-bg.jpg',
  meditation: '/banner/meditation.png',
  breathwork: '/banner/meditation.png',
  hiit: '/images/connect-people.webp',
  bootcamp: '/banner/athletics.jpg',
  crossfit: '/banner/athletics.jpg',
  hyrox: '/banner/athletics.jpg',
  functional: '/banner/athletics.jpg',
  calisthenics: '/banner/athletics.jpg',
  cycling: '/images/community-bonds.jpg',
  swimming: '/images/hero/ice-bath.webp',
  volleyball: '/images/community-bonds.jpg',
  basketball: '/banner/athletics.jpg',
  pilates: '/images/hero/meditation.png',
  hiking: '/images/cities/singapore.jpg',
  climbing: '/images/cities/singapore.jpg',
  outdoor_fitness: '/images/cities/singapore.jpg',
  strength: '/banner/athletics.jpg',
  gym: '/banner/athletics.jpg',
  cold_plunge: '/banner/ice-bath.webp',
  sauna: '/banner/ice-bath.webp',
  recovery: '/banner/ice-bath.webp',
  dance: '/images/connect-people.webp',
  dance_fitness: '/images/connect-people.webp',
  badminton: '/images/community-bonds.jpg',
  tennis: '/images/community-bonds.jpg',
  padel: '/images/community-bonds.jpg',
  combat_fitness: '/banner/athletics.jpg',
  boxing: '/banner/athletics.jpg',
  muay_thai: '/banner/athletics.jpg',
  pickleball: '/images/community-bonds.jpg',
  fitness_social: '/images/hosts/run-club-group.jpg',
  social: '/images/hosts/run-club-group.jpg',
  wellness_circle: '/images/community-bonds.jpg',
  workshop: '/images/list-in-minutes.jpeg',
  retreat: '/images/hero-2.jpg',
  festival: '/images/hero-3.jpg',
  coaching: '/images/organizers-bg.jpg',
  other: '/images/hero/run-club.jpg',
}

export function getCategoryFallbackImage(categorySlug: string | null | undefined) {
  const category = (categorySlug ?? 'other').toLowerCase()
  return SESSION_LISTING_IMAGES[category] || SESSION_LISTING_IMAGES.other
}

export function getCityFallbackImage(citySlugOrName: string | null | undefined) {
  const city = (citySlugOrName ?? '').toLowerCase()
  if (city.includes('bangkok')) return '/images/cities/bangkok.jpg'
  if (city.includes('malaysia') || city.includes('kuala lumpur')) return '/images/cities/malaysia.jpg'
  return '/images/cities/singapore.jpg'
}
