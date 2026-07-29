const fs = require('node:fs')
const path = require('node:path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const APPLY = process.env.COMMUNITY_RESET_APPLY === '1'
const CITY = process.env.COMMUNITY_RESET_CITY || 'Singapore'
const ALL_CITIES = process.env.COMMUNITY_RESET_ALL_CITIES === '1'
const BACKUP_DIR = process.env.COMMUNITY_RESET_BACKUP_DIR || '/private/tmp'
const STAMP = new Date().toISOString().replace(/[:.]/g, '-')
const BACKUP_PATH = path.join(BACKUP_DIR, `sweatbuddies-community-soft-reset-${STAMP}.json`)

function publicDirectoryWhere(cityRecord) {
  return {
    isActive: true,
    moderationStatus: 'LIVE',
    usualArea: { not: null },
    ...(ALL_CITIES ? {} : { cityId: cityRecord?.id ?? '__missing_city__' }),
    OR: [
      { sourceUrl: { not: null } },
      { communityLink: { not: null } },
      { websiteUrl: { not: null } },
      { instagramHandle: { not: null } },
    ],
  }
}

function appendResetNote(existingNote) {
  const resetNote = `[${new Date().toISOString()}] Soft reset: removed from public directory for manual re-verification.`
  return existingNote ? `${resetNote}\n\nPrevious notes:\n${existingNote}` : resetNote
}

async function main() {
  const cityRecord = ALL_CITIES
    ? null
    : await prisma.city.findFirst({
        where: { name: { equals: CITY, mode: 'insensitive' } },
        select: { id: true, name: true, slug: true },
      })

  if (!ALL_CITIES && !cityRecord) {
    throw new Error(`City not found: ${CITY}`)
  }

  const where = publicDirectoryWhere(cityRecord)
  const targets = await prisma.community.findMany({
    where,
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      cityId: true,
      isActive: true,
      isVerified: true,
      verificationStatus: true,
      moderationStatus: true,
      moderationNotes: true,
      usualArea: true,
      usualSchedule: true,
      sourceUrl: true,
      instagramHandle: true,
      websiteUrl: true,
      communityLink: true,
      lastVerifiedAt: true,
      updatedAt: true,
      city: { select: { name: true, slug: true } },
    },
    orderBy: [{ city: { name: 'asc' } }, { name: 'asc' }],
  })

  const allCommunities = await prisma.community.groupBy({
    by: ['moderationStatus', 'verificationStatus', 'isActive', 'isSeeded'],
    _count: { _all: true },
  })

  console.log('Community soft reset audit')
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY_RUN'}`)
  console.log(`Scope: ${ALL_CITIES ? 'all cities' : cityRecord.name}`)
  console.log(`Public directory targets: ${targets.length}`)
  console.log('\nCurrent community table breakdown:')
  for (const row of allCommunities) {
    console.log(
      `  ${row._count._all.toString().padStart(3, ' ')} | active=${row.isActive} | seeded=${row.isSeeded} | moderation=${row.moderationStatus} | verification=${row.verificationStatus}`,
    )
  }

  console.log('\nTarget communities:')
  for (const community of targets) {
    const city = community.city?.name ?? 'Unknown city'
    const source = community.sourceUrl || community.websiteUrl || community.communityLink || community.instagramHandle || 'no source'
    console.log(`  - ${community.name} (${community.slug}) | ${city} | ${community.category} | ${source}`)
  }

  if (!APPLY) {
    console.log('\nDry run only. Re-run with COMMUNITY_RESET_APPLY=1 to archive these public records.')
    await prisma.$disconnect()
    return
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  fs.writeFileSync(
    BACKUP_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scope: ALL_CITIES ? { allCities: true } : { city: cityRecord },
        targets,
      },
      null,
      2,
    ),
  )

  let updated = 0
  for (const community of targets) {
    await prisma.community.update({
      where: { id: community.id },
      data: {
        isActive: false,
        isVerified: false,
        verificationStatus: 'NEEDS_VERIFICATION',
        moderationStatus: 'UNDER_REVIEW',
        lastVerifiedAt: null,
        moderationNotes: appendResetNote(community.moderationNotes),
      },
    })
    updated += 1
  }

  console.log(`\nUpdated: ${updated}`)
  console.log(`Backup: ${BACKUP_PATH}`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
