import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/events'
import { revalidatePath } from 'next/cache'
import { isAdminRequest } from '@/lib/admin-auth'

// POST: Generate slugs for all events without slugs
export async function POST(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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
      },
    })

    const updates: { id: string; slug: string }[] = []
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
      let slug = generateSlug(event.eventName)

      // Ensure uniqueness by adding a suffix if needed
      let uniqueSlug = slug
      let counter = 2
      while (existingSlugs.has(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }

      existingSlugs.add(uniqueSlug)
      updates.push({ id: event.id, slug: uniqueSlug })
    }

    // Update all events with their slugs
    for (const update of updates) {
      await prisma.eventSubmission.update({
        where: { id: update.id },
        data: { slug: update.slug },
      })
    }

    // Revalidate paths
    revalidatePath('/')
    revalidatePath('/e/[id]', 'page')

    return NextResponse.json({
      success: true,
      message: `Generated slugs for ${updates.length} events`,
      updates: updates.map(u => ({ id: u.id, slug: u.slug })),
    })
  } catch (error) {
    console.error('Error generating slugs:', error)
    return NextResponse.json({ error: 'Failed to generate slugs' }, { status: 500 })
  }
}

// GET: Check how many events need slugs
export async function GET(request: Request) {
  if (!await isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const countWithoutSlugs = await prisma.eventSubmission.count({
      where: {
        OR: [
          { slug: null },
          { slug: '' }
        ]
      }
    })

    const totalCount = await prisma.eventSubmission.count()

    return NextResponse.json({
      totalEvents: totalCount,
      eventsWithoutSlugs: countWithoutSlugs,
      eventsWithSlugs: totalCount - countWithoutSlugs,
    })
  } catch (error) {
    console.error('Error checking slugs:', error)
    return NextResponse.json({ error: 'Failed to check slugs' }, { status: 500 })
  }
}
