const { createHash } = require('crypto')
const { readFile } = require('fs/promises')
const path = require('path')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const shouldApply = process.env.RESEARCH_IMPORT_APPLY === '1'
const inputPath = process.env.RESEARCH_IMPORT_FILE
  || path.join(process.cwd(), 'src/data/community-research/singapore-run-clubs-2026-10-14.json')

function researchNote(record) {
  return [
    `Area: ${record.usualArea}`,
    `Schedule: ${record.usualSchedule}`,
    `Join: ${record.officialJoinUrl}`,
    `Price: ${record.priceType}`,
    `Beginner-friendly: ${record.beginnerFriendly ? 'yes' : 'no'}`,
    `Solo-friendly: ${record.soloFriendly ? 'yes' : 'no'}`,
    `Best for: ${record.bestFor}`,
    `Confidence: ${record.confidence}`,
    `Evidence: ${record.evidenceUrls.join(', ')}`,
    `Confirmation needed: ${record.confirmationGaps.join(' ')}`,
  ].join('\n')
}

async function main() {
  const records = JSON.parse(await readFile(inputPath, 'utf8'))
  const existing = await prisma.community.findMany({
    where: {
      OR: [
        { name: { in: records.map((record) => record.communityName), mode: 'insensitive' } },
        { sourceUrl: { in: records.map((record) => record.sourceUrl) } },
        { communityLink: { in: records.map((record) => record.officialJoinUrl) } },
      ],
    },
    select: { name: true, slug: true, sourceUrl: true, communityLink: true },
  })
  const existingNames = new Set(existing.map((record) => record.name.toLowerCase()))
  const candidates = records.filter((record) => !existingNames.has(record.communityName.toLowerCase()))

  const report = {
    mode: shouldApply ? 'apply' : 'dry-run',
    input: records.length,
    existingCommunities: existing,
    candidates: candidates.map((record) => ({
      name: record.communityName,
      confidence: record.confidence,
      sourceUrl: record.sourceUrl,
    })),
  }
  console.log(JSON.stringify(report, null, 2))
  if (!shouldApply) return

  for (const record of candidates) {
    await prisma.communityNomination.upsert({
      where: { sourceUrl: record.sourceUrl },
      update: {
        communityName: record.communityName,
        city: record.city,
        category: record.category,
        note: researchNote(record),
        moderationStatus: 'UNDER_REVIEW',
        moderationNotes: `Founder research import. ${record.confidence} confidence; organizer confirmation required before approval.`,
      },
      create: {
        communityName: record.communityName,
        city: record.city,
        category: record.category,
        sourceUrl: record.sourceUrl,
        note: researchNote(record),
        submitterName: 'SweatBuddies research',
        ipHash: createHash('sha256').update('sweatbuddies-founder-research').digest('hex'),
        status: 'PENDING',
        moderationStatus: 'UNDER_REVIEW',
        moderationNotes: `Founder research import. ${record.confidence} confidence; organizer confirmation required before approval.`,
      },
    })
  }

  console.log(JSON.stringify({ imported: candidates.length, status: 'UNDER_REVIEW' }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => prisma.$disconnect())
