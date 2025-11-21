import { PrismaClient, ActivityType, GroupPrivacy, UserRole } from '@prisma/client'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

// South-East Asian cities with coordinates
const CITIES = [
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, country: 'Indonesia' },
  { name: 'Manila', lat: 14.5995, lng: 120.9842, country: 'Philippines' },
  { name: 'Kuala Lumpur', lat: 3.1390, lng: 101.6869, country: 'Malaysia' },
  { name: 'Ho Chi Minh City', lat: 10.8231, lng: 106.6297, country: 'Vietnam' },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, country: 'Singapore' },
]

// South-East Asian names
const SEA_NAMES = {
  thai: ['Somchai', 'Anong', 'Niran', 'Sirikit', 'Chai', 'Mali', 'Kamol', 'Porn'],
  indonesian: ['Budi', 'Siti', 'Agus', 'Dewi', 'Hadi', 'Ratna', 'Adi', 'Nur'],
  filipino: ['Jose', 'Maria', 'Juan', 'Ana', 'Carlos', 'Rosa', 'Miguel', 'Carmen'],
  malaysian: ['Ahmad', 'Fatimah', 'Ali', 'Siti', 'Hassan', 'Aminah', 'Ibrahim', 'Zainab'],
  vietnamese: ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vo', 'Dang', 'Bui'],
  singaporean: ['Wei', 'Mei', 'Jun', 'Ling', 'Cheng', 'Hui', 'Ming', 'Xin'],
}

const ACTIVITY_TYPES = Object.values(ActivityType)

const ACTIVITY_TITLES = {
  RUN: ['Morning Run', 'Evening Jog', 'Park Run', 'Riverside Run', 'Trail Run'],
  GYM: ['Strength Training', 'CrossFit Session', 'HIIT Workout', 'Weight Lifting', 'Gym Session'],
  YOGA: ['Sunrise Yoga', 'Vinyasa Flow', 'Hot Yoga', 'Yoga in the Park', 'Meditation Session'],
  HIKE: ['Mountain Hike', 'Nature Trail', 'Forest Walk', 'Hill Climb', 'Jungle Trek'],
  CYCLING: ['City Ride', 'Mountain Biking', 'Coastal Cycle', 'Park Loop', 'Road Cycling'],
  OTHER: ['Beach Workout', 'Swimming', 'Rock Climbing', 'Martial Arts', 'Dance Fitness'],
}

function getRandomSEAName(): string {
  const nameGroups = Object.values(SEA_NAMES)
  const randomGroup = faker.helpers.arrayElement(nameGroups)
  return faker.helpers.arrayElement(randomGroup)
}

function getRandomCity() {
  return faker.helpers.arrayElement(CITIES)
}

function getRandomActivityTitle(type: ActivityType): string {
  const titles = ACTIVITY_TITLES[type]
  return faker.helpers.arrayElement(titles)
}

// Add slight randomness to coordinates (within ~5km radius)
function addCoordinateVariation(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: lat + (Math.random() - 0.5) * 0.05,
    lng: lng + (Math.random() - 0.5) * 0.05,
  }
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Make idempotent - clear existing data
  console.log('🧹 Clearing existing data...')
  await prisma.message.deleteMany()
  await prisma.userGroup.deleteMany()
  await prisma.userActivity.deleteMany()
  await prisma.group.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.user.deleteMany()

  // Create 20 users
  console.log('👥 Creating 20 users...')
  const users = []
  for (let i = 0; i < 20; i++) {
    const name = getRandomSEAName()
    const city = getRandomCity()
    // Use pravatar.cc for reliable avatar images (1-70 available)
    const avatarNumber = (i % 70) + 1
    const user = await prisma.user.create({
      data: {
        email: `${name.toLowerCase()}${i + 1}@testsea.com`,
        name: `${name} ${faker.person.lastName()}`,
        imageUrl: `https://i.pravatar.cc/150?img=${avatarNumber}`,
      },
    })
    users.push(user)
  }
  console.log(`✅ Created ${users.length} users`)

  // Create 30 activities across cities
  console.log('🏃 Creating 30 activities...')
  const activities = []
  for (let i = 0; i < 30; i++) {
    const city = getRandomCity()
    const type = faker.helpers.arrayElement(ACTIVITY_TYPES)
    const coords = addCoordinateVariation(city.lat, city.lng)
    const randomUser = faker.helpers.arrayElement(users)

    const activity = await prisma.activity.create({
      data: {
        title: getRandomActivityTitle(type),
        description: faker.lorem.sentences(2),
        type,
        city: city.name,
        latitude: coords.lat,
        longitude: coords.lng,
        startTime: faker.date.soon({ days: 14 }),
        endTime: faker.date.soon({ days: 15 }),
        maxPeople: faker.number.int({ min: 5, max: 30 }),
        userId: randomUser.id,
      },
    })
    activities.push(activity)
  }
  console.log(`✅ Created ${activities.length} activities`)

  // Create 5 public groups per city (30 total)
  console.log('👫 Creating groups...')
  const groups = []
  for (const city of CITIES) {
    for (let i = 0; i < 5; i++) {
      // Find activities for this city
      const cityActivities = activities.filter((a) => a.city === city.name)
      const linkedActivity = cityActivities.length > 0 ? faker.helpers.arrayElement(cityActivities) : null

      const group = await prisma.group.create({
        data: {
          name: `${city.name} ${faker.helpers.arrayElement(['Runners', 'Fitness Club', 'Yoga Group', 'Hikers', 'Cyclists'])}`,
          description: `A community of fitness enthusiasts in ${city.name}. ${faker.lorem.sentence()}`,
          privacy: GroupPrivacy.PUBLIC,
          activityId: linkedActivity?.id,
        },
      })
      groups.push(group)

      // Add 3-5 random members to each group
      const numMembers = faker.number.int({ min: 3, max: 5 })
      const groupMembers = faker.helpers.arrayElements(users, numMembers)

      for (let j = 0; j < groupMembers.length; j++) {
        await prisma.userGroup.create({
          data: {
            userId: groupMembers[j].id,
            groupId: group.id,
            role: j === 0 ? UserRole.ADMIN : UserRole.MEMBER,
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
    // Get members of this group
    const members = await prisma.userGroup.findMany({
      where: { groupId: group.id },
      include: { user: true },
    })

    if (members.length === 0) continue

    for (let i = 0; i < 3; i++) {
      const randomMember = faker.helpers.arrayElement(members)
      await prisma.message.create({
        data: {
          content: faker.lorem.sentences(faker.number.int({ min: 1, max: 3 })),
          groupId: group.id,
          userId: randomMember.userId,
        },
      })
      messageCount++
    }
  }
  console.log(`✅ Created ${messageCount} messages`)

  // Create some user-activity relationships (users joining activities)
  console.log('🎯 Creating user-activity relationships...')
  let userActivityCount = 0
  for (let i = 0; i < 50; i++) {
    const randomUser = faker.helpers.arrayElement(users)
    const randomActivity = faker.helpers.arrayElement(activities)

    // Check if relationship already exists
    const exists = await prisma.userActivity.findUnique({
      where: {
        userId_activityId: {
          userId: randomUser.id,
          activityId: randomActivity.id,
        },
      },
    })

    if (!exists) {
      await prisma.userActivity.create({
        data: {
          userId: randomUser.id,
          activityId: randomActivity.id,
          status: faker.helpers.arrayElement(['INTERESTED', 'JOINED']),
        },
      })
      userActivityCount++
    }
  }
  console.log(`✅ Created ${userActivityCount} user-activity relationships`)

  console.log('\n✨ Seed completed successfully!')
  console.log(`
  Summary:
  - Users: ${users.length}
  - Activities: ${activities.length}
  - Groups: ${groups.length}
  - Messages: ${messageCount}
  - User-Activity relationships: ${userActivityCount}
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
