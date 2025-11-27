/**
 * Migration Script: Initialize user profile fields
 *
 * This script:
 * 1. Generates slugs for existing users
 * 2. Sets isHost flag for users who have hosted activities
 * 3. Sets hostSince date based on first hosted activity
 *
 * Run with: DATABASE_URL="..." npx tsx scripts/migrate-user-profiles.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function generateSlug(name: string | null, id: string): string {
  const baseName = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30)

  // Add first 8 chars of ID for uniqueness
  return `${baseName}-${id.substring(0, 8)}`
}

async function main() {
  console.log('Starting user profile migration...\n')

  // Get all users without slugs
  const usersWithoutSlugs = await prisma.user.findMany({
    where: { slug: null },
    select: { id: true, name: true, email: true }
  })

  console.log(`Found ${usersWithoutSlugs.length} users without slugs`)

  // Generate slugs for users
  for (const user of usersWithoutSlugs) {
    const slug = generateSlug(user.name, user.id)

    // Extract first name from full name
    const firstName = user.name?.split(' ')[0] || null

    await prisma.user.update({
      where: { id: user.id },
      data: {
        slug,
        firstName
      }
    })

    console.log(`  - Generated slug for ${user.email}: ${slug}`)
  }

  // Set isHost for users who have created activities
  const hostsWithActivities = await prisma.user.findMany({
    where: {
      OR: [
        { activities: { some: {} } },
        { hostedActivities: { some: {} } }
      ]
    },
    select: {
      id: true,
      email: true,
      isHost: true,
      activities: {
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1
      },
      hostedActivities: {
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 1
      }
    }
  })

  console.log(`\nFound ${hostsWithActivities.length} users who have hosted activities`)

  for (const host of hostsWithActivities) {
    // Get earliest activity date
    const dates = [
      host.activities[0]?.createdAt,
      host.hostedActivities[0]?.createdAt
    ].filter(Boolean) as Date[]

    const hostSince = dates.length > 0
      ? dates.reduce((a, b) => a < b ? a : b)
      : new Date()

    if (!host.isHost) {
      await prisma.user.update({
        where: { id: host.id },
        data: {
          isHost: true,
          hostSince
        }
      })
      console.log(`  - Set isHost=true for ${host.email}, hostSince: ${hostSince.toISOString().split('T')[0]}`)
    }
  }

  // Summary
  const summary = await prisma.user.aggregate({
    _count: {
      _all: true
    }
  })

  const hostsCount = await prisma.user.count({
    where: { isHost: true }
  })

  const slugsCount = await prisma.user.count({
    where: { slug: { not: null } }
  })

  console.log('\n=== Migration Summary ===')
  console.log(`Total users: ${summary._count._all}`)
  console.log(`Users with slugs: ${slugsCount}`)
  console.log(`Users marked as hosts: ${hostsCount}`)
  console.log('\nMigration complete!')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
