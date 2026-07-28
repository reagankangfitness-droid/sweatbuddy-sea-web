import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'
import { getCommunityDirectory } from '@/lib/community-directory'
import { COMMUNITY_SEO_GUIDES } from '@/lib/community-seo-guides'

export const dynamic = 'force-dynamic'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.sweatbuddies.co'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/singapore`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/new-to-singapore`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/buddy`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/communities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/support`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ]

  const communityGuidePages: MetadataRoute.Sitemap = COMMUNITY_SEO_GUIDES.map((guide) => ({
    url: `${BASE_URL}/communities/singapore/${guide.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.78,
  }))

  const communityDirectory = await getCommunityDirectory()
  const communityPages: MetadataRoute.Sitemap = communityDirectory.map((community) => ({
    url: `${BASE_URL}/communities/${community.slug}`,
    lastModified: community.lastVerifiedAt ? new Date(community.lastVerifiedAt) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.74,
  }))

  // Approved events
  const events = await prisma.eventSubmission
    .findMany({
      where: { status: 'APPROVED' },
      select: { slug: true, id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    .catch((error) => {
      console.error('Failed to load event sitemap entries:', error)
      return []
    })

  const eventPages: MetadataRoute.Sitemap = events.map((event) => ({
    url: `${BASE_URL}/e/${event.slug || event.id}`,
    lastModified: event.updatedAt,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }))

  return [
    ...staticPages,
    ...communityGuidePages,
    ...communityPages,
    ...eventPages,
  ]
}
