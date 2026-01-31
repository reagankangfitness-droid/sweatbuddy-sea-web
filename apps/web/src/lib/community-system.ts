import { prisma } from '@/lib/prisma'
import { CommunityMemberRole } from '@prisma/client'

/**
 * Generate a URL-friendly slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Generate a unique slug for a community
 */
export async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = generateSlug(baseName)
  let slug = baseSlug
  let counter = 1

  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

/**
 * Check if a user is a member of a community
 */
export async function isCommunityMember(
  communityId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  })
  return !!member
}

/**
 * Check if a user can manage a community (owner or admin)
 */
export async function canManageCommunity(
  communityId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  })
  return member?.role === 'OWNER' || member?.role === 'ADMIN'
}

/**
 * Check if a user is the owner of a community
 */
export async function isCommunityOwner(
  communityId: string,
  userId: string
): Promise<boolean> {
  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  })
  return member?.role === 'OWNER'
}

/**
 * Get a user's role in a community
 */
export async function getCommunityMemberRole(
  communityId: string,
  userId: string
): Promise<CommunityMemberRole | null> {
  const member = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  })
  return member?.role ?? null
}

/**
 * Get community by slug with member count
 */
export async function getCommunityBySlug(slug: string) {
  return prisma.community.findUnique({
    where: { slug },
    include: {
      city: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
          isVerified: true,
        },
      },
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
  })
}

/**
 * Get communities for a city
 */
export async function getCommunitiesByCity(
  citySlug: string,
  options?: {
    limit?: number
    offset?: number
    category?: string
  }
) {
  const { limit = 20, offset = 0, category } = options ?? {}

  const city = await prisma.city.findUnique({
    where: { slug: citySlug },
  })

  if (!city) return []

  return prisma.community.findMany({
    where: {
      cityId: city.id,
      isActive: true,
      ...(category && { category }),
    },
    include: {
      city: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          username: true,
          imageUrl: true,
        },
      },
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
    orderBy: { memberCount: 'desc' },
    take: limit,
    skip: offset,
  })
}

/**
 * Get communities a user belongs to
 */
export async function getUserCommunities(userId: string) {
  return prisma.communityMember.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          city: true,
          _count: {
            select: {
              members: true,
              activities: true,
            },
          },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  })
}

/**
 * Get communities owned by a user
 */
export async function getOwnedCommunities(userId: string) {
  return prisma.community.findMany({
    where: { createdById: userId },
    include: {
      city: true,
      _count: {
        select: {
          members: true,
          activities: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Update community member count (call after adding/removing members)
 */
export async function updateCommunityMemberCount(communityId: string) {
  const count = await prisma.communityMember.count({
    where: { communityId },
  })
  await prisma.community.update({
    where: { id: communityId },
    data: { memberCount: count },
  })
}

/**
 * Update community event count (call after adding/removing events)
 */
export async function updateCommunityEventCount(communityId: string) {
  const count = await prisma.activity.count({
    where: { communityId },
  })
  await prisma.community.update({
    where: { id: communityId },
    data: { eventCount: count },
  })
}

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Validate an invite code and get the community
 */
export async function validateInviteCode(code: string) {
  const invite = await prisma.communityInvite.findUnique({
    where: { code },
    include: {
      community: {
        include: {
          city: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  })

  if (!invite) return null

  // Check if expired
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return null
  }

  // Check if max uses reached
  if (invite.maxUses && invite.usedCount >= invite.maxUses) {
    return null
  }

  return invite
}

/**
 * Use an invite code (increment used count)
 */
export async function useInviteCode(code: string) {
  await prisma.communityInvite.update({
    where: { code },
    data: {
      usedCount: { increment: 1 },
    },
  })
}

/**
 * SEA Cities seed data
 */
export const SEA_CITIES = [
  // Launch cities
  {
    name: 'Singapore',
    slug: 'singapore',
    country: 'Singapore',
    countryCode: 'SG',
    timezone: 'Asia/Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    isLaunched: true,
  },
  {
    name: 'Bangkok',
    slug: 'bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    timezone: 'Asia/Bangkok',
    latitude: 13.7563,
    longitude: 100.5018,
    isLaunched: true,
  },
  // Pipeline cities (not launched yet)
  {
    name: 'Kuala Lumpur',
    slug: 'kuala-lumpur',
    country: 'Malaysia',
    countryCode: 'MY',
    timezone: 'Asia/Kuala_Lumpur',
    latitude: 3.139,
    longitude: 101.6869,
    isLaunched: false,
  },
  {
    name: 'Jakarta',
    slug: 'jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    timezone: 'Asia/Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    isLaunched: false,
  },
  {
    name: 'Manila',
    slug: 'manila',
    country: 'Philippines',
    countryCode: 'PH',
    timezone: 'Asia/Manila',
    latitude: 14.5995,
    longitude: 120.9842,
    isLaunched: false,
  },
  {
    name: 'Ho Chi Minh City',
    slug: 'hcmc',
    country: 'Vietnam',
    countryCode: 'VN',
    timezone: 'Asia/Ho_Chi_Minh',
    latitude: 10.8231,
    longitude: 106.6297,
    isLaunched: false,
  },
  {
    name: 'Bali',
    slug: 'bali',
    country: 'Indonesia',
    countryCode: 'ID',
    timezone: 'Asia/Makassar',
    latitude: -8.3405,
    longitude: 115.092,
    isLaunched: false,
  },
]

/**
 * Seed cities into the database
 */
export async function seedCities() {
  for (const city of SEA_CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: city,
      create: city,
    })
  }
}
