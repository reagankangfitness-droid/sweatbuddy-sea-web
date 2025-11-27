// Script to backfill group chats for existing activities that don't have one
// Run with: npx tsx scripts/backfill-group-chats.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfillGroupChats() {
  console.log('Starting group chat backfill...\n')

  // Find all activities that don't have a group chat
  const activitiesWithoutGroup = await prisma.activity.findMany({
    where: {
      deletedAt: null,
      groups: {
        none: {}
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        }
      },
      userActivities: {
        where: {
          status: 'JOINED',
          deletedAt: null,
        },
        select: {
          userId: true,
        }
      }
    }
  })

  console.log(`Found ${activitiesWithoutGroup.length} activities without group chats\n`)

  for (const activity of activitiesWithoutGroup) {
    console.log(`Processing: "${activity.title}" (${activity.id})`)

    try {
      // Create group chat
      const group = await prisma.group.create({
        data: {
          name: `${activity.title} - Group Chat`,
          description: `Group chat for ${activity.title} activity`,
          privacy: 'PRIVATE',
          activityId: activity.id,
        },
      })

      console.log(`  Created group: ${group.id}`)

      // Add host as admin
      const hostId = activity.hostId || activity.userId
      await prisma.userGroup.create({
        data: {
          userId: hostId,
          groupId: group.id,
          role: 'ADMIN',
        },
      })
      console.log(`  Added host (${activity.user?.name || hostId}) as admin`)

      // Add existing participants as members
      const participantIds = activity.userActivities
        .map(ua => ua.userId)
        .filter(id => id !== hostId) // Exclude host, already added

      for (const participantId of participantIds) {
        await prisma.userGroup.create({
          data: {
            userId: participantId,
            groupId: group.id,
            role: 'MEMBER',
          },
        })
      }

      if (participantIds.length > 0) {
        console.log(`  Added ${participantIds.length} participant(s) as members`)
      }

      console.log(`  ✓ Done\n`)
    } catch (error) {
      console.error(`  ✗ Error:`, error)
    }
  }

  console.log('\nBackfill complete!')
}

backfillGroupChats()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
