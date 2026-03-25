import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// City IDs from database
const CITIES = {
  singapore: 'cml236hkw0000t8fze8orkybl',
  bangkok: 'cml236hnx0001t8fzjxadwggl',
  kuala_lumpur: 'cml236hpb0002t8fzq310afjz',
  jakarta: 'cml236hqo0003t8fz1elc0uop',
  manila: 'cml236hs20004t8fzhxoi4sag',
  hcmc: 'cml236htg0005t8fz8k23omf0',
  bali: 'cml236huw0006t8fze4dmpnmt',
}

interface CommunityInput {
  name: string
  category: string
  description: string
  instagramHandle: string | null
  cityId: string
  websiteUrl?: string
  communityLink?: string
  schedule?: string
}

const communities: CommunityInput[] = [
  // === SINGAPORE ===
  {
    name: 'Running Department',
    category: 'running',
    description: 'Free, no-frills, volunteer-led running community since 2013. All paces welcome — just show up and run.',
    instagramHandle: 'runningdepartment',
    cityId: CITIES.singapore,
    websiteUrl: 'https://www.runningdept.com/',
    schedule: 'Wed evenings (CBD) + Sat mornings (various locations)',
  },
  {
    name: 'Fast and Free Running Club',
    category: 'running',
    description: 'Kaya toast-themed run club. Pacers called "Toasties." Community-driven with strong Singapore identity.',
    instagramHandle: 'fastandfree.rc',
    cityId: CITIES.singapore,
    schedule: 'Sat AM — Kaya Run (ends with kaya toast + coffee), Toasted Thursday',
  },
  {
    name: 'PUMA Nitro Run Club SG',
    category: 'running',
    description: 'Performance-focused, coach-led running sessions. Free and capped for quality coaching.',
    instagramHandle: 'pumanitrorunclub_sg',
    cityId: CITIES.singapore,
    schedule: 'Every Tue 7-9pm + 1 Sat/month',
  },
  {
    name: 'Volt Runners SG',
    category: 'running',
    description: 'Fun, community-oriented run crew. Free to join, all levels welcome.',
    instagramHandle: 'voltrunnerssg',
    cityId: CITIES.singapore,
    schedule: 'Every Thu 7pm',
  },
  {
    name: 'The Slowcial Club',
    category: 'running',
    description: "Singapore's happiest run club — no timing, no competition, just vibes. 3km loop around Marina Bay.",
    instagramHandle: 'the.slowcialclub',
    cityId: CITIES.singapore,
    schedule: 'Sat mornings — 3km Marina Bay loop',
  },
  {
    name: 'Singapore Runners Club',
    category: 'running',
    description: "Singapore's largest running club. All levels from beginners to marathon runners. Weekly runs and interval training.",
    instagramHandle: 'singaporerunnersclub',
    cityId: CITIES.singapore,
    schedule: 'Weekly runs + interval training at stadiums',
  },
  {
    name: 'Parkrun Singapore',
    category: 'running',
    description: 'Free, weekly, timed 5K community runs. Part of the global Parkrun movement across 23 countries.',
    instagramHandle: 'parkrunsg',
    cityId: CITIES.singapore,
    websiteUrl: 'https://www.parkrun.sg/',
    schedule: 'Every Sat AM at East Coast Park, Bishan Park, Bay East Garden',
  },
  {
    name: 'ANZA Cycling',
    category: 'cycling',
    description: "Singapore's largest social cycling club. 400+ members from 35 nations. Multiple pace groups for all levels.",
    instagramHandle: 'anzacycling',
    cityId: CITIES.singapore,
    websiteUrl: 'https://anza.org.sg/sports/cycling',
    schedule: 'Regular group rides, multiple pace groups',
  },
  {
    name: 'UFIT Bootcamps',
    category: 'hiit',
    description: "Singapore's premier outdoor training specialist. 80 sessions per week across 12 locations island-wide.",
    instagramHandle: 'ufitbootcamps',
    cityId: CITIES.singapore,
    websiteUrl: 'https://www.ufitbootcamps.com.sg/',
    schedule: '80 sessions/week at 12 locations',
  },

  // === BANGKOK ===
  {
    name: 'PUMA Nitro Run Club MY',
    category: 'running',
    description: 'Performance-driven, coach-led running sessions in Kuala Lumpur.',
    instagramHandle: 'pumanitrorunclub_my',
    cityId: CITIES.kuala_lumpur,
    schedule: 'Wed 8:30pm at Arena Sukan KL',
  },

  // === JAKARTA ===
  {
    name: 'IndoRunners',
    category: 'running',
    description: "Indonesia's largest independent running community since 2009. 122K strong across the archipelago.",
    instagramHandle: 'indorunners',
    cityId: CITIES.jakarta,
    schedule: 'Regular community runs',
  },
  {
    name: 'HOKA Run Club Indonesia',
    category: 'running',
    description: '"Why run alone when you can fly together." Brand-led social running community across Indonesia.',
    instagramHandle: 'hokarunclub.id',
    cityId: CITIES.jakarta,
    schedule: 'Bi-monthly group runs',
  },

  // === BALI ===
  {
    name: 'Rise Run Bali',
    category: 'running',
    description: "Bali's community run club. Sunrise and sunset beach runs — 4K and 8K options, no signup needed.",
    instagramHandle: 'riserunbali',
    cityId: CITIES.bali,
    websiteUrl: 'https://www.riserunbali.com/',
    schedule: 'Sunrise + sunset runs, 4K/8K, no signup needed',
  },
  {
    name: 'IndoRunners Bali',
    category: 'running',
    description: 'Running movement in Bali since 2012. From track workouts to morning road runs.',
    instagramHandle: 'indorunnersbali',
    cityId: CITIES.bali,
    schedule: 'WorkOut Wednesday + Barong Morning Run 6am',
  },

  // === KUALA LUMPUR ===
  {
    name: 'GODSPEED',
    category: 'running',
    description: 'KL-based running club building a community of runners who push each other to be better.',
    instagramHandle: 'godspeed.rc',
    cityId: CITIES.kuala_lumpur,
    schedule: 'Regular runs',
  },
  {
    name: 'KL Frontrunners',
    category: 'running',
    description: 'Diverse, inclusive running group. All paces welcome. Meets at KLCC Park.',
    instagramHandle: 'klfrontrunners',
    cityId: CITIES.kuala_lumpur,
    schedule: 'Sat 8:15am at KLCC Park',
  },

  // === MANILA ===
  {
    name: '5 AM Gang Run Club',
    category: 'running',
    description: "Metro Manila's largest early-bird running community. 16,000+ members who choose sunrise over snooze.",
    instagramHandle: '5amgangrunclub',
    cityId: CITIES.manila,
    schedule: 'Early morning runs',
  },

  // === HO CHI MINH CITY ===
  {
    name: 'Good Strides Run Club',
    category: 'running',
    description: 'Inclusive HCMC running community. All levels welcome for Sunday morning runs.',
    instagramHandle: 'goodstridesrunclubvn',
    cityId: CITIES.hcmc,
    schedule: 'Sun 7am, 5K-10K at Soma Saigon',
  },
]

async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  // Check for uniqueness
  let slug = base
  let counter = 1
  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`
    counter++
  }
  return slug
}

async function main() {
  // Get admin user (Reagan) for createdById
  const adminUser = await prisma.user.findFirst({
    where: { isHost: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true },
  })

  if (!adminUser) {
    console.error('No admin user found')
    process.exit(1)
  }
  console.log(`Using admin user: ${adminUser.name} (${adminUser.id})\n`)

  // Load existing communities for duplicate check
  const existing = await prisma.community.findMany({
    select: { name: true, instagramHandle: true, slug: true },
  })

  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))
  const existingHandles = new Set(
    existing.filter((c) => c.instagramHandle).map((c) => c.instagramHandle!.toLowerCase())
  )

  let created = 0
  let skipped = 0

  for (const input of communities) {
    const normalizedHandle = input.instagramHandle?.toLowerCase().replace(/^@/, '').trim() || null
    const normalizedName = input.name.toLowerCase()

    // Duplicate check by name or instagram handle
    if (existingNames.has(normalizedName)) {
      console.log(`SKIP (name exists): ${input.name}`)
      skipped++
      continue
    }
    if (normalizedHandle && existingHandles.has(normalizedHandle)) {
      console.log(`SKIP (handle exists): ${input.name} (@${normalizedHandle})`)
      skipped++
      continue
    }

    const slug = await generateSlug(input.name)

    // Build description with schedule
    let description = input.description
    if (input.schedule) {
      description += `\n\nSchedule: ${input.schedule}`
    }

    const community = await prisma.community.create({
      data: {
        name: input.name,
        slug,
        category: input.category,
        description,
        instagramHandle: normalizedHandle,
        websiteUrl: input.websiteUrl || null,
        communityLink: input.communityLink || null,
        cityId: input.cityId,
        createdById: adminUser.id,
        isSeeded: true,
        claimableBy: normalizedHandle,
        memberCount: 0,
      },
    })

    // Create community chat
    await prisma.communityChat.create({
      data: { communityId: community.id },
    })

    console.log(`CREATED: ${input.name} → /communities/${slug}`)
    created++

    // Track for duplicate checking within this run
    existingNames.add(normalizedName)
    if (normalizedHandle) existingHandles.add(normalizedHandle)
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
