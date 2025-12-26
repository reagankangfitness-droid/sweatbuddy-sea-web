import { PrismaClient } from '@prisma/client'

// Generate URL-friendly slug from event name and date
function generateSlug(name: string, eventDate?: string | null): string {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Remove consecutive hyphens
    .substring(0, 50)         // Limit length

  // Add date suffix if available for uniqueness
  if (eventDate) {
    const date = new Date(eventDate)
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase()
    const day = date.getDate()
    return `${baseSlug}-${month}-${day}`
  }

  return baseSlug
}

async function main() {
  const prisma = new PrismaClient()

  try {
    // Get all events without slugs
    const eventsWithoutSlugs = await prisma.eventSubmission.findMany({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      },
      select: {
        id: true,
        eventName: true,
        eventDate: true,
      },
    })

    console.log(`Found ${eventsWithoutSlugs.length} events without slugs`)

    const existingSlugs = new Set<string>()

    // Get all existing slugs to avoid duplicates
    const existingEvents = await prisma.eventSubmission.findMany({
      where: {
        slug: { not: null }
      },
      select: { slug: true }
    })
    existingEvents.forEach(e => {
      if (e.slug) existingSlugs.add(e.slug)
    })

    // Generate unique slugs for each event
    for (const event of eventsWithoutSlugs) {
      const eventDate = event.eventDate?.toISOString().split('T')[0] || null
      let slug = generateSlug(event.eventName, eventDate)

      // Ensure uniqueness by adding a suffix if needed
      let uniqueSlug = slug
      let counter = 1
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      existingSlugs.add(uniqueSlug)

      // Update the event
      await prisma.eventSubmission.update({
        where: { id: event.id },
        data: { slug: uniqueSlug },
      })

      console.log(`Updated event "${event.eventName}" with slug: ${uniqueSlug}`)
    }

    console.log(`\nDone! Generated slugs for ${eventsWithoutSlugs.length} events`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
