import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const ACTIVITY_IMAGES = {
  RUN: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800',
  GYM: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800',
  YOGA: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800',
  HIKE: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
  CYCLING: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
  OTHER: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800',
}

async function main() {
  console.log('🖼️  Starting to add images to activities...\n')

  // Get all activities
  const activities = await prisma.activity.findMany({
    select: {
      id: true,
      title: true,
      type: true,
      imageUrl: true,
    },
  })

  console.log(`Found ${activities.length} activities\n`)

  // Update each activity with appropriate image
  for (const activity of activities) {
    const imageUrl = ACTIVITY_IMAGES[activity.type as keyof typeof ACTIVITY_IMAGES] || ACTIVITY_IMAGES.OTHER

    if (activity.imageUrl === imageUrl) {
      console.log(`✓ ${activity.title} (${activity.type}) - Already has image`)
      continue
    }

    await prisma.activity.update({
      where: { id: activity.id },
      data: { imageUrl },
    })

    console.log(`✓ Updated: ${activity.title} (${activity.type})`)
  }

  console.log('\n✅ All activities updated with images!')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
