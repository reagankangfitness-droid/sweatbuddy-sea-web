import { PrismaClient } from '@prisma/client'

// Generate URL-friendly slug from event name (no dates)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove consecutive hyphens
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
    .substring(0, 50)         // Limit length
}

async function main() {
  const prisma = new PrismaClient()

  try {
    // Get ALL events to regenerate slugs without dates
    const allEvents = await prisma.eventSubmission.findMany({
      select: {
        id: true,
        eventName: true,
      },
      orderBy: { createdAt: 'asc' }, // Oldest first so they get the base slug
    })

    console.log(`Regenerating slugs for ${allEvents.length} events (removing dates)...`)

    const usedSlugs = new Set<string>()

    // Generate unique slugs for each event
    for (const event of allEvents) {
      let slug = generateSlug(event.eventName)

      // Ensure uniqueness by adding a suffix if needed
      let uniqueSlug = slug
      let counter = 2
      while (usedSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      usedSlugs.add(uniqueSlug)

      // Update the event
      await prisma.eventSubmission.update({
        where: { id: event.id },
        data: { slug: uniqueSlug },
      })

      console.log(`"${event.eventName}" → ${uniqueSlug}`)
    }

    console.log(`\nDone! Regenerated slugs for ${allEvents.length} events`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
