import type { CommunityData } from '@/app/communities/CommunitiesPageClient'

export interface CommunitySeoGuide {
  slug: string
  title: string
  metaDescription: string
  eyebrow: string
  headline: string
  intro: string
  ctaLabel: string
  filterLabel: string
  relatedSearches: string[]
}

export const COMMUNITY_SEO_GUIDES: CommunitySeoGuide[] = [
  {
    slug: 'beginner-friendly-run-clubs',
    title: 'Beginner-Friendly Run Clubs in Singapore',
    metaDescription:
      'Find source-checked Singapore run clubs with clearer join paths, usual areas, schedule signals, and beginner-friendly cues.',
    eyebrow: 'Run clubs',
    headline: 'Beginner-friendly run clubs in Singapore',
    intro:
      'Start with running communities that make the first step easier: clear public links, recurring rhythm, and cues that solo runners can use before showing up.',
    ctaLabel: 'Get run club picks',
    filterLabel: 'Beginner run clubs',
    relatedSearches: ['Solo-friendly run clubs', 'Free running communities', 'Central Singapore running groups'],
  },
  {
    slug: 'beginner-friendly-yoga-communities',
    title: 'Beginner-Friendly Yoga and Wellness Communities in Singapore',
    metaDescription:
      'Browse yoga, meditation, and wellness communities in Singapore with official links and soft-entry context for beginners.',
    eyebrow: 'Yoga and wellness',
    headline: 'Beginner-friendly yoga and wellness communities in Singapore',
    intro:
      'For people who want a calmer way in, these listings prioritize mind-body groups with official source links and beginner-friendly signals.',
    ctaLabel: 'Get wellness picks',
    filterLabel: 'Yoga and wellness',
    relatedSearches: ['Meditation communities', 'Outdoor yoga Singapore', 'Solo-friendly wellness groups'],
  },
  {
    slug: 'pickleball-padel-groups',
    title: 'Pickleball and Padel Groups for Beginners in Singapore',
    metaDescription:
      'Find pickleball, padel, tennis, and other social racquet groups in Singapore with public join or booking paths.',
    eyebrow: 'Social games',
    headline: 'Pickleball and padel groups for beginners in Singapore',
    intro:
      'Racquet sports are easier when you do not need to bring a fixed partner. Start with groups and hubs that make social play easier to discover.',
    ctaLabel: 'Get game picks',
    filterLabel: 'Social racquet groups',
    relatedSearches: ['Pickleball open play', 'Padel Singapore', 'Social badminton groups'],
  },
  {
    slug: 'free-fitness-communities',
    title: 'Free and Low-Cost Fitness Communities in Singapore',
    metaDescription:
      'Find free and mixed-cost fitness communities in Singapore with official links, area context, and beginner-friendly cues.',
    eyebrow: 'Free and low-cost',
    headline: 'Free and low-cost fitness communities in Singapore',
    intro:
      'A good first fitness community should not require a big commitment. These listings emphasize groups with free or mixed-cost entry signals.',
    ctaLabel: 'Get free picks',
    filterLabel: 'Free or mixed-cost',
    relatedSearches: ['Free run clubs', 'Free outdoor workouts', 'Low-cost social fitness'],
  },
  {
    slug: 'social-fitness-communities',
    title: 'Social Fitness Communities in Singapore',
    metaDescription:
      'Browse social fitness communities in Singapore by activity, area, vibe, schedule, and official join path.',
    eyebrow: 'Social fitness',
    headline: 'Social fitness communities in Singapore',
    intro:
      'If the hardest part is walking in alone, start with communities where the social context is part of the point.',
    ctaLabel: 'Get social picks',
    filterLabel: 'Social communities',
    relatedSearches: ['Solo-friendly communities', 'Beginner-friendly groups', 'Fitness communities near me'],
  },
]

export function getCommunitySeoGuide(slug: string) {
  return COMMUNITY_SEO_GUIDES.find((guide) => guide.slug === slug) ?? null
}

export function filterCommunitiesForSeoGuide(communities: CommunityData[], guide: CommunitySeoGuide) {
  const singaporeCommunities = communities.filter((community) => community.citySlug === 'singapore')

  switch (guide.slug) {
    case 'beginner-friendly-run-clubs':
      return singaporeCommunities.filter(
        (community) => community.category === 'running' && community.beginnerFriendly,
      )
    case 'beginner-friendly-yoga-communities':
      return singaporeCommunities.filter(
        (community) =>
          ['yoga', 'pilates', 'meditation'].includes(community.category) &&
          community.beginnerFriendly,
      )
    case 'pickleball-padel-groups':
      return singaporeCommunities.filter(
        (community) =>
          ['pickleball', 'padel', 'tennis', 'badminton'].includes(community.category) ||
          community.vibeTags.some((tag) => ['racquet', 'open_play'].includes(tag)),
      )
    case 'free-fitness-communities':
      return singaporeCommunities.filter((community) =>
        ['free', 'free_paid', 'mixed'].includes((community.priceType ?? '').toLowerCase()),
      )
    case 'social-fitness-communities':
      return singaporeCommunities.filter((community) =>
        community.soloFriendly ||
        community.vibeTags.some((tag) => ['social', 'open_play', 'neighborhood', 'beginner'].includes(tag)),
      )
    default:
      return []
  }
}
