import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/events'
import { revalidatePath } from 'next/cache'

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'sweatbuddies-admin-2024'

function isAdmin(request: Request): boolean {
  const authHeader = request.headers.get('x-admin-secret')
  return authHeader === ADMIN_SECRET
}

// POST: Generate slugs for all events without slugs
export async function POST(request: Request) {
  if (!isAdmin(request)) {
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
        eventDate: true,
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
  if (!isAdmin(request)) {
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
