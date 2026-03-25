import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
  schedule?: string
}

const communities: CommunityInput[] = [
  // ===========================
  // HIIT / BOOTCAMP / CROSSFIT
  // ===========================

  // Singapore
  {
    name: 'Ministry of Fitness',
    category: 'hiit',
    description: 'Military-style outdoor bootcamps led by ex/serving British and Singaporean Armed Forces members.',
    instagramHandle: 'ministryoffitnesssg',
    cityId: CITIES.singapore,
    schedule: 'Outdoor military bootcamps, multiple sessions/week',
  },
  {
    name: 'Mobilus HYROX Lab',
    category: 'hiit',
    description: 'Official HYROX Training Club. Beginner to race prep classes with coaching and community.',
    instagramHandle: 'mobilus.sg',
    cityId: CITIES.singapore,
    schedule: 'HYROX training classes at Chinatown, Clarke Quay, New Bahru',
  },
  {
    name: 'CrossFit Urban Edge',
    category: 'crossfit',
    description: 'CrossFit box in central Singapore. Community-driven with open events and competitions.',
    instagramHandle: 'crossfiturbanedge',
    cityId: CITIES.singapore,
    schedule: 'CrossFit WODs, community competitions',
  },
  {
    name: 'Ground Zero SG',
    category: 'cycling',
    description: 'Boutique studio with tribe mentality — "more than a studio, a tribe united by sweat." RIDE + Resistance classes.',
    instagramHandle: 'groundzerosg',
    cityId: CITIES.singapore,
    schedule: 'Indoor cycling + strength classes',
  },
  {
    name: 'adidas Runners Singapore',
    category: 'running',
    description: '8+ years running. Part of global community in 76+ cities. All paces welcome.',
    instagramHandle: 'adidassg',
    cityId: CITIES.singapore,
    schedule: 'Bi-weekly Sat runs + monthly Thu runs',
  },
  {
    name: 'The High Panters',
    category: 'running',
    description: 'Tempos, long-distance, stadium track workouts. Unique "Host Your Hood" residential area run series.',
    instagramHandle: 'thehighpanters',
    cityId: CITIES.singapore,
    schedule: 'Group runs, tempo sessions, social runs',
  },

  // Bangkok
  {
    name: 'Bangkok Bootcamp',
    category: 'hiit',
    description: "Thailand's leading outdoor fitness program since 2003. 68+ indoor/outdoor sessions per month.",
    instagramHandle: 'bangkokbootcamp',
    cityId: CITIES.bangkok,
    schedule: 'Weekly outdoor bootcamps at 4 locations',
  },

  // Bali
  {
    name: 'Wanderlust Fitness Village',
    category: 'crossfit',
    description: "Bali's largest CrossFit box. 2000sqm. 15K+ members since 2016. Global tribe of like-minded people.",
    instagramHandle: 'wanderlustfitnessvillage_bali',
    cityId: CITIES.bali,
    schedule: 'CrossFit WODs, community events',
  },
  {
    name: 'Raw Gym Canggu',
    category: 'martial-arts',
    description: 'Muay Thai, Boxing, CrossFit, Landmine workouts. Strong social media presence in Canggu.',
    instagramHandle: 'raw_gym_canggu',
    cityId: CITIES.bali,
    schedule: 'Combat + CrossFit classes',
  },

  // Jakarta
  {
    name: 'Master Bootcamp Jakarta',
    category: 'hiit',
    description: 'Community exercises every Saturday. Part of Moving Body Culture promoting healthy movement.',
    instagramHandle: 'masterbootcamp',
    cityId: CITIES.jakarta,
    schedule: 'Weekly outdoor bootcamp (Saturdays)',
  },

  // Manila
  {
    name: 'CrossFit ETHOS',
    category: 'crossfit',
    description: "One of the biggest CrossFit boxes in Manila. Largest outdoor CrossFit affiliate in Metro Manila.",
    instagramHandle: 'thecrossfitethos',
    cityId: CITIES.manila,
    schedule: 'CrossFit WODs, open events',
  },

  // HCMC
  {
    name: 'CrossFit Thao Dien',
    category: 'crossfit',
    description: 'Winner of Best Gym & Best Group Fitness 2024. "Animal Flow" bootcamp Thursdays.',
    instagramHandle: 'crossfitthaodien',
    cityId: CITIES.hcmc,
    schedule: 'CrossFit WODs, bootcamp, Animal Flow',
  },

  // ===========================
  // PILATES / BARRE / MOVEMENT
  // ===========================

  // Singapore
  {
    name: 'The Feel Good Tribe',
    category: 'pilates',
    description: "Women's fitness & wellness community. Outdoor Pilates, beach workouts, Zumba, retreat days, brunch socials. Women 35+.",
    instagramHandle: 'thefeelgoodtribe',
    cityId: CITIES.singapore,
    schedule: 'Outdoor Pilates at East Coast Park, beach workouts at Sentosa',
  },
  {
    name: 'Off Duty Pilates',
    category: 'pilates',
    description: 'Est. 2019, vibrant hybrid Reformer + TRX studio. Annual themed classes. English & Korean.',
    instagramHandle: 'offdutypilates',
    cityId: CITIES.singapore,
    schedule: 'Group reformer, themed seasonal classes, community events',
  },

  // Bangkok
  {
    name: 'Physique 57 Bangkok',
    category: 'barre',
    description: "Bangkok's leading barre studio. Celebrity-backed, ballet-inspired low-impact barre with 3 intensity levels.",
    instagramHandle: 'physique57bkk',
    cityId: CITIES.bangkok,
    schedule: 'Barre group classes, community challenges',
  },

  // Bali
  {
    name: 'MAJA Studio',
    category: 'pilates',
    description: 'Boutique wellness studio on Batu Bolong strip. Pilates, barre, yoga + cafe. 140K followers.',
    instagramHandle: 'majaspabali',
    cityId: CITIES.bali,
    schedule: 'Mat Pilates, barre, Experience Days, wellness events',
  },
  {
    name: 'Revive + Pilates',
    category: 'pilates',
    description: '80+ weekly classes. Reformer, mat, barre + cafe with matcha & smoothies. Sister studio POWER+REVIVE.',
    instagramHandle: 'reviveandpilates.studio',
    cityId: CITIES.bali,
    schedule: 'Reformer, mat, barre classes in Canggu & Umalas',
  },

  // KL
  {
    name: 'SUN:DAY Pilates',
    category: 'pilates',
    description: 'Female-only studio. Reformer, mat, barre, yoga, sound baths. Safe space for women.',
    instagramHandle: 'sundaypilatesmy',
    cityId: CITIES.kuala_lumpur,
    schedule: 'Unlimited reformer, mat, barre & yoga at Bangsar, Subang Jaya, IOI',
  },

  // Jakarta
  {
    name: 'Bumi Pilates & Movement',
    category: 'pilates',
    description: 'Zen studio with signature classes. 3 locations. Community events including "Pawlates" pet-friendly sessions.',
    instagramHandle: 'bumi.jkt',
    cityId: CITIES.jakarta,
    schedule: 'Reformer, mat, prenatal classes at Simprug, Mega Kuningan, Pondok Indah',
  },

  // Manila
  {
    name: 'OCA Collective',
    category: 'wellness',
    description: 'Movement & recovery collective. Barre, Pilates, yoga, ice baths, sound baths, breathwork. Inclusivity-focused.',
    instagramHandle: 'theocacollective',
    cityId: CITIES.manila,
    schedule: 'HIIT Barre, Power Barre, mat Pilates, yogalates, sound baths at BGC',
  },

  // HCMC
  {
    name: 'MOVE Vietnam',
    category: 'cycling',
    description: 'Boutique fitness: RIDE (cycling), HYBRID (strength), REFORM (reformer Pilates). Strong social community.',
    instagramHandle: 'move.vietnam',
    cityId: CITIES.hcmc,
    schedule: 'Reformer Pilates, indoor cycling, Social Nights at Thao Dien',
  },

  // ===========================
  // ICE BATH / COLD PLUNGE / WELLNESS
  // ===========================

  // Singapore
  {
    name: 'Cold Plunge SG',
    category: 'wellness',
    description: 'Guided cold plunge community. FREE trials, warm magnesium plunge, sunrise yoga, breathwork, and soundbath.',
    instagramHandle: 'cold.plunge.sg',
    cityId: CITIES.singapore,
    schedule: 'Regular guided sessions + free trials',
  },
  {
    name: 'REVA Social Wellness',
    category: 'wellness',
    description: "Singapore's first semi-outdoor contrast therapy club. Ice baths, hot pool, outdoor sauna at TRIFECTA on Orchard Road.",
    instagramHandle: 'revasocialwellness',
    cityId: CITIES.singapore,
    schedule: 'Drop-in access, no booking required',
  },
  {
    name: 'Nowhere Baths',
    category: 'wellness',
    description: 'Gender-neutral communal bathhouse at Dempsey Hill. Hot baths, sauna, steam room, cold plunge. Sound baths & forest therapy events.',
    instagramHandle: 'nowherebaths',
    cityId: CITIES.singapore,
    schedule: 'Mon 10am-9pm, Tue-Fri 8am-9pm, Sat-Sun 9am-9pm',
  },
  {
    name: 'The Ice Bath Club Singapore',
    category: 'wellness',
    description: 'Guided ice bath sessions and structured breathing techniques. 3 locations across Singapore.',
    instagramHandle: 'theicebathclub_sg',
    cityId: CITIES.singapore,
    schedule: 'Guided sessions at East Coast, River Valley, Duxton',
  },
  {
    name: 'Altered States',
    category: 'wellness',
    description: 'Ecstatic dance and movement community. Drug/alcohol-free, phone-free, judgment-free space for conscious dance.',
    instagramHandle: 'alteredstates.sg',
    cityId: CITIES.singapore,
    schedule: 'Full Moon ecstatic dance events + regular sessions',
  },
  {
    name: 'Ommaega',
    category: 'yoga',
    description: 'Pay-what-you-can outdoor yoga + free sunrise yoga. Making yoga accessible to everyone.',
    instagramHandle: 'ommaega_',
    cityId: CITIES.singapore,
    schedule: 'Recurring outdoor classes + free sunrise yoga',
  },

  // Bali
  {
    name: 'The Yoga Barn',
    category: 'yoga',
    description: "Ubud's iconic yoga and wellness community. Ecstatic dance Fridays & Sundays since 2009. Multi-discipline classes.",
    instagramHandle: 'theyogabarn',
    cityId: CITIES.bali,
    schedule: 'Ecstatic dance Fri nights + Sun mornings, daily yoga',
  },

  // ===========================
  // CYCLING / OUTDOOR SPORTS
  // ===========================

  // Singapore
  {
    name: 'Rapha Cycling Club Singapore',
    category: 'cycling',
    description: 'Premium cycling culture community. Clubhouse hosts talks, screenings, workshops. Active gravel and road rides.',
    instagramHandle: 'rapha_singapore',
    cityId: CITIES.singapore,
    schedule: 'Weekly club rides, gravel grinders, cafe rides',
  },
  {
    name: 'Sawadee Cycling Club',
    category: 'cycling',
    description: '"Tribe of happy cycling enthusiasts" in Singapore. Photography + cycling kits.',
    instagramHandle: 'sawadeecyclingclub',
    cityId: CITIES.singapore,
    schedule: 'Social rides, photography rides',
  },
  {
    name: 'Zephyr Running Club',
    category: 'running',
    description: "Structured weekly training across Singapore's best spots — CBD loops, track work, coastal long runs.",
    instagramHandle: 'zephyrrunningclub',
    cityId: CITIES.singapore,
    schedule: 'Weekly structured sessions',
  },

  // Singapore - Martial Arts
  {
    name: 'Impact MMA',
    category: 'martial-arts',
    description: 'Pioneer in Singapore MMA scene for 10+ years. Muay Thai, Boxing, BJJ.',
    instagramHandle: 'impactmmasg',
    cityId: CITIES.singapore,
    schedule: 'Group classes, sparring, competitions',
  },

  // Singapore - Climbing
  {
    name: 'BFF Climb',
    category: 'climbing',
    description: 'Community bouldering gym. Hosts BFF Verticrux Speed Climbing Competition.',
    instagramHandle: 'bffclimb.boulderzone',
    cityId: CITIES.singapore,
    schedule: 'Open sessions, competitions',
  },

  // Singapore - Pickleball/Padel
  {
    name: 'Ricochet Padel',
    category: 'padel',
    description: 'Biggest padel chain in Singapore. Sentosa, East Coast; Orchard & Clarke Quay opening 2026.',
    instagramHandle: 'ricochetpadel',
    cityId: CITIES.singapore,
    schedule: 'Open play, tournaments',
  },

  // Singapore - Dance
  {
    name: 'Beatfactory Fitness',
    category: 'dance-fitness',
    description: 'Zumba, Cardio Jam, KpopX Fitness, K-pop MV classes, K-Street Jazz.',
    instagramHandle: 'beatfactoryfitness',
    cityId: CITIES.singapore,
    schedule: 'Weekly dance fitness classes',
  },

  // Bangkok - Martial Arts
  {
    name: 'Elite Fight Club Bangkok',
    category: 'martial-arts',
    description: 'Muay Thai, Boxing, BJJ, MMA, Fitness at Sukhumvit. 110K followers.',
    instagramHandle: 'elitefightclubbkk',
    cityId: CITIES.bangkok,
    schedule: 'Training sessions, community events',
  },

  // Bali - Climbing
  {
    name: 'Bali Climbing',
    category: 'climbing',
    description: 'Bouldering gym + rock climbing excursions in Canggu. Community sessions and outdoor trips.',
    instagramHandle: 'baliclimbing',
    cityId: CITIES.bali,
    schedule: 'Open sessions, outdoor climbing excursions',
  },

  // Bali - Surf
  {
    name: 'Canggu Surf Community',
    category: 'surfing',
    description: 'Local board riders group in Canggu. Surf sessions and community meetups.',
    instagramHandle: 'canggusurfcommunity',
    cityId: CITIES.bali,
    schedule: 'Surf sessions, community meetups',
  },

  // KL - Pickleball
  {
    name: 'Pickle Social Club',
    category: 'pickleball',
    description: 'Lifestyle-led pickleball club in Kuala Lumpur. 17K followers.',
    instagramHandle: 'picklesocialclub.co',
    cityId: CITIES.kuala_lumpur,
    schedule: 'Social play, tournaments',
  },

  // Jakarta - Cycling
  {
    name: 'Jakarta Cycling Community',
    category: 'cycling',
    description: 'Cycling, coffee, social events. Group rides ending at cafes.',
    instagramHandle: 'jkt_cc',
    cityId: CITIES.jakarta,
    schedule: 'Group rides + cafe stops',
  },

  // Jakarta - Climbing
  {
    name: 'IndoClimb',
    category: 'climbing',
    description: 'Indoor climbing gym across Jakarta. FX Sudirman, Lippo Kemang, Kuningan City.',
    instagramHandle: 'indo.climb',
    cityId: CITIES.jakarta,
    schedule: 'Open sessions, competitions',
  },

  // Manila - Cycling
  {
    name: 'Bikes & Coffee Manila',
    category: 'cycling',
    description: 'Cycling + coffee community in Manila.',
    instagramHandle: 'bikesandcoffeemanila',
    cityId: CITIES.manila,
    schedule: 'Social rides ending at cafes',
  },

  // HCMC
  {
    name: 'Founders Running Club HCMC',
    category: 'running',
    description: 'Founders, investors, tech/creative people running + networking at Sala, Thu Duc.',
    instagramHandle: 'foundersrc',
    cityId: CITIES.hcmc,
    schedule: 'Sat 6:30am weekly runs',
  },
]

async function generateSlug(name: string): Promise<string> {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()

  let slug = base
  let counter = 1
  while (await prisma.community.findUnique({ where: { slug } })) {
    slug = `${base}-${counter}`
    counter++
  }
  return slug
}

async function main() {
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

  // Load existing for duplicate check
  const existing = await prisma.community.findMany({
    select: { name: true, instagramHandle: true },
  })

  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()))
  const existingHandles = new Set(
    existing.filter((c) => c.instagramHandle).map((c) => c.instagramHandle!.toLowerCase())
  )

  let created = 0
  let skipped = 0
  const byCategory: Record<string, number> = {}
  const byCity: Record<string, number> = {}

  for (const input of communities) {
    const normalizedHandle = input.instagramHandle?.toLowerCase().replace(/^@/, '').trim() || null
    const normalizedName = input.name.toLowerCase()

    if (existingNames.has(normalizedName)) {
      console.log(`SKIP (name): ${input.name}`)
      skipped++
      continue
    }
    if (normalizedHandle && existingHandles.has(normalizedHandle)) {
      console.log(`SKIP (handle @${normalizedHandle}): ${input.name}`)
      skipped++
      continue
    }

    const slug = await generateSlug(input.name)

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
        cityId: input.cityId,
        createdById: adminUser.id,
        isSeeded: true,
        claimableBy: normalizedHandle,
        memberCount: 0,
      },
    })

    await prisma.communityChat.create({
      data: { communityId: community.id },
    })

    console.log(`CREATED: ${input.name} → /communities/${slug} [${input.category}]`)
    created++

    byCategory[input.category] = (byCategory[input.category] || 0) + 1
    // Reverse lookup city name
    const cityName = Object.entries(CITIES).find(([, id]) => id === input.cityId)?.[0] || 'unknown'
    byCity[cityName] = (byCity[cityName] || 0) + 1

    existingNames.add(normalizedName)
    if (normalizedHandle) existingHandles.add(normalizedHandle)
  }

  console.log(`\n=== RESULTS ===`)
  console.log(`Created: ${created}, Skipped: ${skipped}`)
  console.log(`\nBy category:`)
  for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`)
  }
  console.log(`\nBy city:`)
  for (const [city, count] of Object.entries(byCity).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${city}: ${count}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
