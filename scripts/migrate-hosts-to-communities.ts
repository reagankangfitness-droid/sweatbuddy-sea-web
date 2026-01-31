/**
 * Migration Script: Create Communities from Existing Hosts
 *
 * This script:
 * 1. Seeds SEA cities
 * 2. Creates a community for each host with events
 * 3. Links their events to the community
 * 4. Adds past attendees as community members
 *
 * Run with: npx tsx scripts/migrate-hosts-to-communities.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// SEA Cities to seed
const SEA_CITIES = [
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

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniqueSlug(baseName: string): Promise<string> {
  const baseSlug = generateSlug(baseName)
  let slug = baseSlug
  let counter = 1

  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

async function seedCities() {
  console.log('🌏 Seeding SEA cities...')

  for (const city of SEA_CITIES) {
    await prisma.city.upsert({
      where: { slug: city.slug },
      update: city,
      create: city,
    })
    console.log(`  ✓ ${city.name}`)
  }

  console.log('✅ Cities seeded\n')
}

async function inferCityFromEvents(hostId: string): Promise<string | null> {
  // Get the most common city from the host's events
  const events = await prisma.activity.findMany({
    where: { hostId },
    select: { city: true },
  })

  if (events.length === 0) return null

  // Count city occurrences
  const cityCounts: Record<string, number> = {}
  for (const event of events) {
    if (event.city) {
      cityCounts[event.city.toLowerCase()] = (cityCounts[event.city.toLowerCase()] || 0) + 1
    }
  }

  // Find most common
  let maxCity = null
  let maxCount = 0
  for (const [city, count] of Object.entries(cityCounts)) {
    if (count > maxCount) {
      maxCity = city
      maxCount = count
    }
  }

  // Map to our city slugs
  if (maxCity?.includes('singapore')) return 'singapore'
  if (maxCity?.includes('bangkok')) return 'bangkok'
  if (maxCity?.includes('kuala') || maxCity?.includes('kl')) return 'kuala-lumpur'
  if (maxCity?.includes('jakarta')) return 'jakarta'
  if (maxCity?.includes('manila')) return 'manila'
  if (maxCity?.includes('ho chi minh') || maxCity?.includes('hcmc') || maxCity?.includes('saigon')) return 'hcmc'
  if (maxCity?.includes('bali')) return 'bali'

  // Default to Singapore if unclear
  return 'singapore'
}

async function inferCategoryFromEvents(hostId: string): Promise<string> {
  // Get the most common category from the host's events
  const events = await prisma.activity.findMany({
    where: { hostId },
    select: { categorySlug: true, type: true },
  })

  if (events.length === 0) return 'fitness'

  // Count category occurrences
  const categoryCounts: Record<string, number> = {}
  for (const event of events) {
    const cat = event.categorySlug || event.type?.toLowerCase() || 'fitness'
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
  }

  // Find most common
  let maxCategory = 'fitness'
  let maxCount = 0
  for (const [category, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCategory = category
      maxCount = count
    }
  }

  return maxCategory
}

async function getUniqueAttendees(hostId: string): Promise<string[]> {
  // Get all unique users who have attended this host's events
  const attendees = await prisma.userActivity.findMany({
    where: {
      activity: { hostId },
      status: { in: ['JOINED', 'COMPLETED'] },
    },
    select: { userId: true },
    distinct: ['userId'],
  })

  return attendees
    .map((a) => a.userId)
    .filter((id) => id !== hostId) // Exclude the host themselves
}

async function migrateHostsToCommunities() {
  console.log('🏃 Migrating hosts to communities...\n')

  // Find all hosts with at least one event
  const hosts = await prisma.user.findMany({
    where: {
      isHost: true,
      hostedActivities: {
        some: {},
      },
    },
    include: {
      hostedActivities: {
        select: { id: true },
      },
    },
  })

  console.log(`Found ${hosts.length} hosts with events\n`)

  let created = 0
  let skipped = 0

  for (const host of hosts) {
    // Check if host already has a community
    const existingCommunity = await prisma.community.findFirst({
      where: { createdById: host.id },
    })

    if (existingCommunity) {
      console.log(`⏭️  Skipping ${host.name || host.email} - already has community`)
      skipped++
      continue
    }

    // Infer city from events
    const citySlug = await inferCityFromEvents(host.id)
    const city = citySlug
      ? await prisma.city.findUnique({ where: { slug: citySlug } })
      : null

    // Infer category from events
    const category = await inferCategoryFromEvents(host.id)

    // Generate community name and slug
    const communityName = host.name || host.username || `${host.email.split('@')[0]}'s Community`
    const slug = await generateUniqueSlug(communityName)

    console.log(`📦 Creating community for ${host.name || host.email}...`)

    // Create the community
    const community = await prisma.community.create({
      data: {
        name: communityName,
        slug,
        description: host.bio,
        coverImage: host.coverImage,
        cityId: city?.id,
        category,
        instagramHandle: host.instagram,
        websiteUrl: host.website,
        createdById: host.id,
        memberCount: 1,
        eventCount: host.hostedActivities.length,
      },
    })

    // Make host the OWNER
    await prisma.communityMember.create({
      data: {
        communityId: community.id,
        userId: host.id,
        role: 'OWNER',
      },
    })

    // Link all their events to the community
    await prisma.activity.updateMany({
      where: { hostId: host.id },
      data: { communityId: community.id },
    })

    // Add past attendees as MEMBERS
    const attendeeIds = await getUniqueAttendees(host.id)
    let memberCount = 1 // Start with owner

    for (const attendeeId of attendeeIds) {
      try {
        await prisma.communityMember.create({
          data: {
            communityId: community.id,
            userId: attendeeId,
            role: 'MEMBER',
          },
        })
        memberCount++
      } catch {
        // Ignore duplicate key errors
      }
    }

    // Update member count
    await prisma.community.update({
      where: { id: community.id },
      data: { memberCount },
    })

    // Create community chat
    await prisma.communityChat.create({
      data: { communityId: community.id },
    })

    // Update city community count
    if (city) {
      await prisma.city.update({
        where: { id: city.id },
        data: { communityCount: { increment: 1 } },
      })
    }

    console.log(`  ✓ Created "${community.name}" with ${memberCount} members, ${host.hostedActivities.length} events`)
    created++
  }

  console.log(`\n✅ Migration complete!`)
  console.log(`   Created: ${created} communities`)
  console.log(`   Skipped: ${skipped} (already had communities)`)
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗')
  console.log('║  SweatBuddies: Host to Community Migration             ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  try {
    // Step 1: Seed cities
    await seedCities()

    // Step 2: Migrate hosts to communities
    await migrateHostsToCommunities()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
