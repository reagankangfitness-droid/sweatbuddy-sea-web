import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

const CITIES = [
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
]

const ACTIVITY_TYPES = ['RUN', 'GYM', 'YOGA', 'HIKE', 'CYCLING', 'OTHER']

const ACTIVITY_IMAGES = [
  'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b',
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438',
  'https://images.unsplash.com/photo-1534438327276-14e5300c3a48',
  'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b',
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd',
]

async function main() {
  console.log('🌱 Starting database seed...')

  // Create 10 users
  console.log('👥 Creating users...')
  const users = []
  for (let i = 0; i < 10; i++) {
    const user = await prisma.user.create({
      data: {
        id: `user_${i + 1}`,
        email: `user${i + 1}@sweatbuddy.com`,
        name: faker.person.fullName(),
        imageUrl: faker.image.avatar(),
      },
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // Create 30 activities
  console.log('🏃 Creating activities...')
  const activities = []
  for (let i = 0; i < 30; i++) {
    const city = faker.helpers.arrayElement(CITIES)
    const type = faker.helpers.arrayElement(ACTIVITY_TYPES)
    const user = faker.helpers.arrayElement(users)
    const startTime = faker.date.future()
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // 1 hour later

    const activity = await prisma.activity.create({
      data: {
        title: `${type.charAt(0) + type.slice(1).toLowerCase()} Session in ${city.name}`,
        description: faker.lorem.paragraph(),
        type: type as any,
        city: city.name,
        latitude: city.lat + (Math.random() - 0.5) * 0.1,
        longitude: city.lng + (Math.random() - 0.5) * 0.1,
        startTime,
        endTime,
        maxPeople: faker.helpers.arrayElement([5, 10, 15, 20, null]),
        imageUrl: faker.helpers.arrayElement(ACTIVITY_IMAGES),
        price: faker.helpers.arrayElement([0, 5, 10, 15, 20]),
        currency: 'USD',
        status: 'PUBLISHED',
        userId: user.id,
        hostId: user.id,
      },
    })
    activities.push(activity)
  }
  console.log(`✅ Created ${activities.length} activities`)

  console.log('\n🎉 Database seeded successfully!')
  console.log(`📊 Summary:`)
  console.log(`   - Users: ${users.length}`)
  console.log(`   - Activities: ${activities.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
