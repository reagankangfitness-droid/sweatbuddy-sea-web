import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('\n📊 Verifying Seed Data\n')

  // Count records
  const userCount = await prisma.user.count()
  const activityCount = await prisma.activity.count()
  const groupCount = await prisma.group.count()
  const messageCount = await prisma.message.count()

  console.log('Record Counts:')
  console.log(`  Users: ${userCount}`)
  console.log(`  Activities: ${activityCount}`)
  console.log(`  Groups: ${groupCount}`)
  console.log(`  Messages: ${messageCount}`)

  // Sample users
  const sampleUsers = await prisma.user.findMany({ take: 3 })
  console.log('\n📧 Sample Users:')
  sampleUsers.forEach((u) => {
    console.log(`  - ${u.name} (${u.email}) in ${u.city}`)
  })

  // Verify all emails end with @testsea.com
  const allUsers = await prisma.user.findMany()
  const validEmails = allUsers.every((u) => u.email.endsWith('@testsea.com'))
  console.log(`\n✅ All emails end with @testsea.com: ${validEmails}`)

  // Sample activities with coordinates
  const sampleActivities = await prisma.activity.findMany({
    take: 3,
    include: { user: true },
  })
  console.log('\n🏃 Sample Activities:')
  sampleActivities.forEach((a) => {
    console.log(
      `  - ${a.name} in ${a.city} (${a.latitude.toFixed(4)}, ${a.longitude.toFixed(4)})`
    )
  })

  // Groups by city
  const groupsByCity = await prisma.group.groupBy({
    by: ['city'],
    _count: { city: true },
  })
  console.log('\n👥 Groups by City:')
  groupsByCity.forEach((g) => {
    console.log(`  - ${g.city}: ${g._count.city} groups`)
  })

  console.log('\n✨ Verification Complete!\n')
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
