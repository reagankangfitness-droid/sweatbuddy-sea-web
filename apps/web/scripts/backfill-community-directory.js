const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const VERIFIED_AT = new Date('2026-06-30T00:00:00.000Z')

const DIRECTORY_UPDATES = [
  {
    slug: 'anza-cycling',
    usualArea: 'Islandwide road rides',
    joinPlatform: 'website',
    priceType: 'membership',
    beginnerFriendly: true,
    vibeTags: ['road cycling', 'pace groups', 'social rides'],
  },
  {
    slug: 'altered-states',
    usualArea: 'Pop-up dance spaces',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['ecstatic dance', 'phone-free', 'wellness'],
  },
  {
    slug: 'bff-climb',
    usualArea: 'Boulderzone',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['bouldering', 'indoor climbing', 'competitions'],
  },
  {
    slug: 'beatfactory-fitness',
    usualArea: 'Singapore studios',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['dance fitness', 'zumba', 'k-pop'],
  },
  {
    slug: 'caliversity',
    assignCity: 'Singapore',
    usualArea: 'Singapore',
    usualSchedule: 'Check official page for current sessions',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['calisthenics', 'street workout', 'beginner-friendly'],
  },
  {
    slug: 'cold-plunge-sg',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['cold plunge', 'breathwork', 'recovery'],
  },
  {
    slug: 'crossfit-urban-edge',
    usualArea: 'Central Singapore',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: false,
    vibeTags: ['crossfit', 'strength', 'wod'],
  },
  {
    slug: 'fast-and-free-running-club',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['run club', 'social', 'coffee'],
  },
  {
    slug: 'fitbeat-singapore',
    usualArea: 'Outdoor pop-ups',
    joinPlatform: 'instagram',
    priceType: 'free_paid',
    beginnerFriendly: true,
    vibeTags: ['outdoor workout', 'dance', 'social'],
  },
  {
    slug: 'ground-zero-sg',
    usualArea: 'Ground Zero studios',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['indoor cycling', 'strength', 'studio'],
  },
  {
    slug: 'impact-mma',
    usualArea: 'Impact MMA',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['mma', 'muay thai', 'boxing'],
  },
  {
    slug: 'ministry-of-fitness',
    usualArea: 'Outdoor locations',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['bootcamp', 'outdoor', 'military-style'],
  },
  {
    slug: 'mobilus-hyrox-lab',
    usualArea: 'Chinatown, Clarke Quay, New Bahru',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['hyrox', 'functional fitness', 'race prep'],
  },
  {
    slug: 'nowhere-baths',
    usualArea: 'Dempsey Hill',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['bathhouse', 'sauna', 'cold plunge'],
  },
  {
    slug: 'off-duty-pilates',
    usualArea: 'Pilates studio',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['pilates', 'reformer', 'trx'],
  },
  {
    slug: 'ommaega',
    usualArea: 'Outdoor locations',
    joinPlatform: 'instagram',
    priceType: 'pay_what_you_can',
    beginnerFriendly: true,
    vibeTags: ['outdoor yoga', 'sunrise', 'accessible'],
  },
  {
    slug: 'parkrun-singapore',
    usualArea: 'East Coast Park, Bishan Park, Bay East Garden',
    joinPlatform: 'website',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['5k', 'timed run', 'volunteer-led'],
  },
  {
    slug: 'puma-nitro-run-club-sg',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['coach-led', 'performance', 'run club'],
  },
  {
    slug: 'rapha-cycling-club-singapore',
    usualArea: 'Rapha Singapore',
    joinPlatform: 'instagram',
    priceType: 'membership',
    beginnerFriendly: false,
    vibeTags: ['road cycling', 'clubhouse', 'gravel'],
  },
  {
    slug: 'reva-social-wellness',
    usualArea: 'TRIFECTA Orchard',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['contrast therapy', 'ice bath', 'sauna'],
  },
  {
    slug: 'ricochet-padel',
    usualArea: 'Sentosa, East Coast',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['padel', 'open play', 'tournaments'],
  },
  {
    slug: 'run-days-fun-days',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free_paid',
    beginnerFriendly: true,
    vibeTags: ['social runs', 'intervals', 'long runs'],
  },
  {
    slug: 'running-department',
    usualArea: 'CBD and rotating Singapore routes',
    joinPlatform: 'website',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['volunteer-led', 'all paces', 'no-frills'],
  },
  {
    slug: 'sawadee-cycling-club',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free_paid',
    beginnerFriendly: false,
    vibeTags: ['cycling', 'photography', 'social rides'],
  },
  {
    slug: 'singapore-frontrunners',
    assignCity: 'Singapore',
    usualArea: 'Singapore',
    usualSchedule: 'Check official page for current runs',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['run club', 'inclusive', 'social'],
  },
  {
    slug: 'singapore-runners-club',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['run club', 'intervals', 'all levels'],
  },
  {
    slug: 'slowflo-run-club',
    assignCity: 'Singapore',
    usualArea: 'Singapore',
    usualSchedule: 'Check official page for current runs',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['slow runs', 'social', 'beginner-friendly'],
  },
  {
    slug: 'sport-because',
    usualArea: 'Beach and outdoor locations',
    joinPlatform: 'instagram',
    priceType: 'charity',
    beginnerFriendly: true,
    vibeTags: ['beach volleyball', 'hiit', 'charity'],
  },
  {
    slug: 'the-feel-good-tribe',
    usualArea: 'East Coast Park, Sentosa',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['women-only', 'pilates', 'wellness'],
  },
  {
    slug: 'the-high-panters',
    usualArea: 'Singapore neighborhoods',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: false,
    vibeTags: ['tempo', 'track', 'long distance'],
  },
  {
    slug: 'the-ice-bath-club-singapore',
    usualArea: 'East Coast, River Valley, Duxton',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['ice bath', 'breathwork', 'guided'],
  },
  {
    slug: 'the-slowcial-club',
    usualArea: 'Marina Bay',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['slow run', 'social', 'no timing'],
  },
  {
    slug: 'ufit-bootcamps',
    usualArea: '12 Singapore locations',
    joinPlatform: 'website',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['bootcamp', 'outdoor', 'strength'],
  },
  {
    slug: 'volt-runners-sg',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['run club', 'all levels', 'social'],
  },
  {
    slug: 'wild-fig-yoga',
    usualArea: 'Outdoor locations',
    joinPlatform: 'instagram',
    priceType: 'paid',
    beginnerFriendly: true,
    vibeTags: ['outdoor yoga', 'soundbath', 'stretch'],
  },
  {
    slug: 'yoga-for-a-change',
    usualArea: 'East Coast Park',
    joinPlatform: 'instagram',
    priceType: 'charity',
    beginnerFriendly: true,
    vibeTags: ['charity yoga', 'outdoor', 'sunday'],
  },
  {
    slug: 'zephyr-running-club',
    usualArea: 'CBD, track, coastal routes',
    joinPlatform: 'instagram',
    priceType: 'free_paid',
    beginnerFriendly: false,
    vibeTags: ['structured training', 'track', 'long runs'],
  },
  {
    slug: 'adidas-runners-singapore',
    usualArea: 'Singapore',
    joinPlatform: 'instagram',
    priceType: 'free',
    beginnerFriendly: true,
    vibeTags: ['brand run club', 'all paces', 'social'],
  },
]

function officialUrl(community, joinPlatform) {
  if (community.communityLink) return community.communityLink
  if (community.websiteUrl) return community.websiteUrl
  if (community.instagramHandle) {
    return `https://www.instagram.com/${community.instagramHandle.replace(/^@/, '')}/`
  }
  if (joinPlatform === 'website' && community.websiteUrl) return community.websiteUrl
  return null
}

function scheduleFromDescription(description) {
  if (!description) return null
  const schedule = description.match(/(?:^|\n)Schedule:\s*(.+)$/m)
  return schedule?.[1]?.trim() || null
}

async function recalculateCityCounts() {
  const cities = await prisma.city.findMany({ select: { id: true } })
  for (const city of cities) {
    const communityCount = await prisma.community.count({
      where: { cityId: city.id, isActive: true },
    })
    await prisma.city.update({
      where: { id: city.id },
      data: { communityCount },
    })
  }
}

async function main() {
  const dryRun = process.env.DRY_RUN === '1'
  const singapore = await prisma.city.findFirst({
    where: { name: { equals: 'Singapore', mode: 'insensitive' } },
    select: { id: true },
  })

  if (!singapore) {
    throw new Error('Singapore city row not found')
  }

  let updated = 0
  let missing = 0

  for (const update of DIRECTORY_UPDATES) {
    const community = await prisma.community.findUnique({
      where: { slug: update.slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        websiteUrl: true,
        communityLink: true,
        instagramHandle: true,
      },
    })

    if (!community) {
      missing += 1
      console.log(`MISS ${update.slug}`)
      continue
    }

    const sourceUrl = update.sourceUrl || officialUrl(community, update.joinPlatform)
    const data = {
      usualArea: update.usualArea,
      usualSchedule:
        update.usualSchedule || scheduleFromDescription(community.description),
      joinPlatform: update.joinPlatform,
      vibeTags: update.vibeTags,
      priceType: update.priceType,
      beginnerFriendly: update.beginnerFriendly,
      sourceUrl,
      communityLink: community.communityLink || sourceUrl,
      lastVerifiedAt: sourceUrl ? VERIFIED_AT : null,
      ...(update.assignCity === 'Singapore' ? { cityId: singapore.id } : {}),
    }

    if (dryRun) {
      console.log(`DRY ${community.slug}`, data)
    } else {
      await prisma.community.update({
        where: { id: community.id },
        data,
      })
      console.log(`UPDATED ${community.name}`)
    }
    updated += 1
  }

  if (!dryRun) {
    await recalculateCityCounts()
  }

  console.log(JSON.stringify({ dryRun, updated, missing }, null, 2))
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
