const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()
const apply = process.env.LINK_OFFICIAL_SESSIONS_APPLY === '1'

const links = [
  {
    communitySlug: 'caliversity',
    hostName: 'Caliversity Official',
    titlePrefix: 'Caliversity',
  },
]

async function main() {
  for (const link of links) {
    const community = await prisma.community.findUnique({
      where: { slug: link.communitySlug },
      select: { id: true, name: true },
    })

    if (!community) throw new Error(`Community not found: ${link.communitySlug}`)

    const where = {
      communityId: null,
      title: { startsWith: link.titlePrefix },
      user: { name: link.hostName },
    }
    const count = await prisma.activity.count({ where })
    console.log(`${apply ? 'Linking' : 'Would link'} ${count} ${link.hostName} sessions to ${community.name}`)

    if (apply && count > 0) {
      const result = await prisma.activity.updateMany({
        where,
        data: { communityId: community.id, categorySlug: 'calisthenics' },
      })
      console.log(`Linked ${result.count} sessions`)
    }
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
