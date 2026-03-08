import { PrismaClient } from '@prisma/client'

/**
 * One-time backfill: Auto-create Community records for organizers
 * with 2+ approved EventSubmissions who have a matching User record.
 *
 * Run: npx tsx apps/web/scripts/seed-communities.ts
 */

function normalizeInstagram(handle: string): string {
  return handle.replace(/^@/, '').toLowerCase().trim()
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

async function generateUniqueSlug(
  prisma: PrismaClient,
  baseName: string
): Promise<string> {
  const baseSlug = generateSlug(baseName)
  let slug = baseSlug
  let counter = 1

  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`
    counter++
  }

  return slug
}

async function main() {
  const prisma = new PrismaClient()

  try {
    console.log('Starting community seed from EventSubmission organizers...\n')

    // 1. Get all distinct organizerInstagram from approved submissions
    const submissions = await prisma.eventSubmission.findMany({
      where: { status: 'APPROVED' },
      select: {
        organizerInstagram: true,
        organizerName: true,
        category: true,
      },
    })

    // 2. Group by normalized instagram handle
    const organizerMap = new Map<
      string,
      { names: string[]; categories: string[]; count: number }
    >()

    for (const sub of submissions) {
      if (!sub.organizerInstagram) continue
      const normalized = normalizeInstagram(sub.organizerInstagram)
      if (!normalized) continue

      const existing = organizerMap.get(normalized) || {
        names: [],
        categories: [],
        count: 0,
      }
      existing.count++
      if (sub.organizerName && !existing.names.includes(sub.organizerName)) {
        existing.names.push(sub.organizerName)
      }
      if (sub.category && !existing.categories.includes(sub.category)) {
        existing.categories.push(sub.category)
      }
      organizerMap.set(normalized, existing)
    }

    // 3. Filter to 2+ approved events
    const qualifying = [...organizerMap.entries()].filter(
      ([, data]) => data.count >= 2
    )

    console.log(
      `Found ${organizerMap.size} distinct organizers, ${qualifying.length} with 2+ approved events\n`
    )

    let created = 0
    let skippedNoUser = 0
    let skippedExists = 0

    for (const [handle, data] of qualifying) {
      // 4a. Find User by matching instagram handle
      const user = await prisma.user.findFirst({
        where: {
          instagram: { equals: handle, mode: 'insensitive' },
        },
      })

      if (!user) {
        console.log(`  SKIP (no user): @${handle} (${data.count} events)`)
        skippedNoUser++
        continue
      }

      // 4b. Check if Community already exists
      const existing = await prisma.community.findFirst({
        where: {
          OR: [
            { createdById: user.id },
            { instagramHandle: { equals: handle, mode: 'insensitive' } },
          ],
        },
      })

      if (existing) {
        // Update event count if needed
        if (existing.eventCount < data.count) {
          await prisma.community.update({
            where: { id: existing.id },
            data: { eventCount: data.count },
          })
          console.log(
            `  UPDATED: @${handle} eventCount ${existing.eventCount} -> ${data.count}`
          )
        }
        skippedExists++
        continue
      }

      // 4c. Get most common category
      const categoryCounts = new Map<string, number>()
      for (const cat of data.categories) {
        categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1)
      }
      const topCategory =
        [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
        'fitness'

      // 4d. Create community
      const name =
        data.names[0] ||
        handle.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

      const slug = await generateUniqueSlug(prisma, name)

      const community = await prisma.community.create({
        data: {
          name,
          slug,
          category: topCategory,
          createdById: user.id,
          isActive: true,
          instagramHandle: handle,
          memberCount: 1,
          eventCount: data.count,
        },
      })

      // Create owner membership
      await prisma.communityMember.create({
        data: {
          communityId: community.id,
          userId: user.id,
          role: 'OWNER',
        },
      })

      console.log(
        `  CREATED: "${name}" (@${handle}) — ${data.count} events, category: ${topCategory}`
      )
      created++
    }

    console.log(`\n--- Summary ---`)
    console.log(`Created: ${created}`)
    console.log(`Skipped (no user): ${skippedNoUser}`)
    console.log(`Skipped (already exists): ${skippedExists}`)
    console.log(`Total qualifying organizers: ${qualifying.length}`)
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
