const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const shouldApply = process.env.COMMUNITY_CLEANUP_APPLY === '1'

const archivedSlugs = [
  'delon-kang',
  'myreen-chuah',
  'reagan-kang',
  'sweatbuddies',
]

async function main() {
  const researchQueue = await prisma.community.findMany({
    where: {
      isSeeded: true,
      isActive: true,
      moderationStatus: 'LIVE',
      usualArea: null,
      usualSchedule: null,
      lastVerifiedAt: null,
    },
    select: { id: true, name: true, slug: true, city: { select: { name: true } } },
    orderBy: { name: 'asc' },
  })
  const archives = await prisma.community.findMany({
    where: { slug: { in: archivedSlugs }, isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  })

  console.log(JSON.stringify({ mode: shouldApply ? 'apply' : 'dry-run', researchQueue, archives }, null, 2))
  if (!shouldApply) return

  const [reviewResult, archiveResult] = await prisma.$transaction([
    prisma.community.updateMany({
      where: { id: { in: researchQueue.map((community) => community.id) } },
      data: {
        moderationStatus: 'UNDER_REVIEW',
        moderationNotes: 'Directory cleanup: incomplete join, area, schedule, or verification metadata.',
      },
    }),
    prisma.community.updateMany({
      where: { id: { in: archives.map((community) => community.id) } },
      data: {
        isActive: false,
        moderationStatus: 'UNDER_REVIEW',
        moderationNotes: 'Directory cleanup: personal or placeholder listing, not a named joinable community.',
      },
    }),
  ])

  console.log(JSON.stringify({ movedToResearchQueue: reviewResult.count, archived: archiveResult.count }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
