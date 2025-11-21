import { PrismaClient } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// Southeast Asian cities with coordinates
const CITIES = [
  { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
  { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
  { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
  { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.139, lng: 101.6869 },
  { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.8231, lng: 106.6297 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
]

// Common Southeast Asian names
const SEA_NAMES = {
  first: [
    'Anh', 'Budi', 'Chen', 'Devi', 'Eka', 'Fatima', 'Gani', 'Hiro',
    'Indra', 'Jasmine', 'Kiet', 'Lina', 'Ming', 'Nora', 'Omar',
    'Priya', 'Quynh', 'Ravi', 'Siti', 'Tan', 'Umar', 'Viet',
    'Wei', 'Xiao', 'Yuki', 'Zara',
  ],
  last: [
    'Nguyen', 'Tan', 'Lee', 'Singh', 'Kumar', 'Wong', 'Santos',
    'Reyes', 'Abdullah', 'Hasan', 'Rahman', 'Chen', 'Lim',
    'Fernandez', 'Garcia', 'Sharma', 'Patel', 'Ali',
  ],
}

const ACTIVITY_TYPES = [
  'Morning Run', 'Evening Jog', 'Cycling', 'Swimming', 'Yoga Session',
  'HIIT Workout', 'Basketball', 'Badminton', 'Tennis', 'Rock Climbing',
  'Gym Session', 'Pilates', 'Muay Thai', 'Boxing', 'Dance Class',
]

const GROUP_TYPES = [
  'Morning Runners', 'Weekend Warriors', 'Fitness Enthusiasts',
  'Cycling Club', 'Yoga Lovers', 'Basketball Squad',
  'Swimming Team', 'HIIT Group', 'Dance Crew', 'Climbing Partners',
]

function getRandomSEAName() {
  const first = faker.helpers.arrayElement(SEA_NAMES.first)
  const last = faker.helpers.arrayElement(SEA_NAMES.last)
  return `${first} ${last}`
}

function getRandomCoordinatesNear(lat: number, lng: number, radiusKm = 5) {
  // Approximate conversion: 1 degree ≈ 111 km
  const radiusDegrees = radiusKm / 111
  const latOffset = (Math.random() - 0.5) * 2 * radiusDegrees
  const lngOffset = (Math.random() - 0.5) * 2 * radiusDegrees
  return {
    latitude: lat + latOffset,
    longitude: lng + lngOffset,
  }
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (idempotent)
  console.log('🧹 Cleaning existing data...')
  await prisma.message.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.user.deleteMany()

  // Create 20 users
  console.log('👥 Creating 20 users...')
  const users = []
  for (let i = 0; i < 20; i++) {
    const city = faker.helpers.arrayElement(CITIES)
    const name = getRandomSEAName()
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}${i}@testsea.com`

    const user = await prisma.user.create({
      data: {
        name,
        email,
        city: city.name,
        country: city.country,
      },
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // Create 30 activities across cities
  console.log('🏃 Creating 30 activities...')
  const activities = []
  for (let i = 0; i < 30; i++) {
    const city = faker.helpers.arrayElement(CITIES)
    const user = faker.helpers.arrayElement(users)
    const coords = getRandomCoordinatesNear(city.lat, city.lng)
    const activityType = faker.helpers.arrayElement(ACTIVITY_TYPES)

    const activity = await prisma.activity.create({
      data: {
        name: activityType,
        description: `${activityType} in ${city.name}`,
        duration: faker.number.int({ min: 20, max: 120 }),
        calories: faker.number.int({ min: 100, max: 800 }),
        city: city.name,
        latitude: coords.latitude,
        longitude: coords.longitude,
        userId: user.id,
      },
    })
    activities.push(activity)
  }
  console.log(`✅ Created ${activities.length} activities`)

  // Create 5 public groups per city (30 groups total)
  console.log('👥 Creating groups...')
  const groups = []
  for (const city of CITIES) {
    for (let i = 0; i < 5; i++) {
      const coords = getRandomCoordinatesNear(city.lat, city.lng, 3)
      const groupType = faker.helpers.arrayElement(GROUP_TYPES)

      const group = await prisma.group.create({
        data: {
          name: `${city.name} ${groupType}`,
          description: `Join us for ${groupType.toLowerCase()} in ${city.name}!`,
          city: city.name,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isPublic: true,
        },
      })
      groups.push(group)

      // Add 3-5 random members to each group
      const memberCount = faker.number.int({ min: 3, max: 5 })
      const groupUsers = faker.helpers.arrayElements(
        users.filter((u) => u.city === city.name),
        Math.min(memberCount, users.filter((u) => u.city === city.name).length)
      )

      for (const user of groupUsers) {
        await prisma.groupMember.create({
          data: {
            groupId: group.id,
            userId: user.id,
            role: faker.helpers.arrayElement(['admin', 'member', 'member']),
          },
        })
      }
    }
  }
  console.log(`✅ Created ${groups.length} groups`)

  // Create 3 messages per group
  console.log('💬 Creating messages...')
  let messageCount = 0
  for (const group of groups) {
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: group.id },
    })

    for (let i = 0; i < 3; i++) {
      if (groupMembers.length === 0) continue

      const member = faker.helpers.arrayElement(groupMembers)
      await prisma.message.create({
        data: {
          content: faker.helpers.arrayElement([
            'Hey everyone! Ready for our next workout?',
            'Great session today! Same time next week?',
            'Does anyone have recommendations for running shoes?',
            'Looking forward to seeing you all at the park!',
            'Who\'s joining the morning session tomorrow?',
            'Thanks for the great workout today team!',
            'Can we change the meeting point this week?',
            'New to the group, excited to join you all!',
          ]),
          groupId: group.id,
          userId: member.userId,
        },
      })
      messageCount++
    }
  }
  console.log(`✅ Created ${messageCount} messages`)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Users: ${users.length}`)
  console.log(`   - Activities: ${activities.length}`)
  console.log(`   - Groups: ${groups.length}`)
  console.log(`   - Messages: ${messageCount}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
