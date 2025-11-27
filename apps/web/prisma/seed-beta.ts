import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Seeding beta system...')

  // Initialize beta settings
  console.log('⚙️  Creating beta settings...')
  await prisma.betaSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      isBetaActive: true,
      maxBetaUsers: 500,
      currentBetaUsers: 0,
      invitesPerUser: 3,
      showSpotsRemaining: true,
      showWaitlistPosition: true,
    },
  })
  console.log('✅ Beta settings initialized')

  // Create admin invite codes
  console.log('🎟️  Creating admin invite codes...')
  const adminCodes = [
    { code: 'SWEATBETA', maxUses: 50, label: 'Launch Code' },
    { code: 'FOUNDER500', maxUses: 100, label: 'Founders Circle' },
    { code: 'VIPACCESS', maxUses: 25, label: 'VIP & Press' },
    { code: 'HOSTBETA', maxUses: 50, label: 'Host Program' },
    { code: 'REAGANBETA', maxUses: 10, label: 'Reagan Personal' },
  ]

  for (const codeData of adminCodes) {
    await prisma.betaInviteCode.upsert({
      where: { code: codeData.code },
      update: {
        maxUses: codeData.maxUses,
        label: codeData.label,
      },
      create: {
        code: codeData.code,
        codeType: 'MULTI',
        maxUses: codeData.maxUses,
        currentUses: 0,
        createdByAdmin: true,
        label: codeData.label,
        isActive: true,
      },
    })
    console.log(`   ✅ Created code: ${codeData.code} (${codeData.maxUses} uses)`)
  }

  console.log('\n🎉 Beta system seeded successfully!')
  console.log('📊 Summary:')
  console.log('   - Beta settings initialized')
  console.log(`   - ${adminCodes.length} admin invite codes created`)
  console.log('\n🔑 Available codes:')
  adminCodes.forEach(c => console.log(`   - ${c.code}: ${c.label}`))
}

main()
  .catch((e) => {
    console.error('❌ Error seeding beta system:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
