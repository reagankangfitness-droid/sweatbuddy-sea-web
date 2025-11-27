/**
 * Migration Script: Update existing activities with categorySlug
 *
 * This script migrates existing activities from the legacy ActivityType enum
 * to the new category system by assigning the most appropriate categorySlug
 * based on their existing type.
 *
 * Run with: npx tsx scripts/migrate-categories.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Mapping from legacy ActivityType to new categorySlug
const LEGACY_TYPE_TO_CATEGORY: Record<string, string> = {
  RUN: 'running', // Maps to Running category
  GYM: 'weight-training', // Maps to Weight Training category
  YOGA: 'yoga', // Maps to Yoga category
  HIKE: 'hiking', // Maps to Hiking category
  CYCLING: 'road-cycling', // Maps to Road Cycling category
  OTHER: 'other', // Maps to Other category
}

async function migrateCategories() {
  console.log('Starting category migration...\n')

  try {
    // Get all activities that don't have a categorySlug yet
    const activities = await prisma.activity.findMany({
      where: {
        categorySlug: null,
      },
      select: {
        id: true,
        title: true,
        type: true,
      },
    })

    console.log(`Found ${activities.length} activities without categorySlug\n`)

    if (activities.length === 0) {
      console.log('No activities to migrate. All activities already have categorySlug.')
      return
    }

    // Update each activity
    let updated = 0
    let errors = 0

    for (const activity of activities) {
      const categorySlug = LEGACY_TYPE_TO_CATEGORY[activity.type] || 'other'

      try {
        await prisma.activity.update({
          where: { id: activity.id },
          data: { categorySlug },
        })
        console.log(`✓ Updated "${activity.title}" (${activity.type}) -> ${categorySlug}`)
        updated++
      } catch (error) {
        console.error(`✗ Failed to update "${activity.title}":`, error)
        errors++
      }
    }

    console.log(`\n--- Migration Complete ---`)
    console.log(`Updated: ${updated}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total: ${activities.length}`)
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration
migrateCategories()
  .then(() => {
    console.log('\nMigration script finished successfully.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error)
    process.exit(1)
  })
