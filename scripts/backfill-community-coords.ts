import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// City center coordinates with slight spread for visual variety
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'cml236hkw0000t8fze8orkybl': { lat: 1.3521, lng: 103.8198 },   // Singapore
  'cml236hnx0001t8fzjxadwggl': { lat: 13.7563, lng: 100.5018 },  // Bangkok
  'cml236hpb0002t8fzq310afjz': { lat: 3.1390, lng: 101.6869 },   // Kuala Lumpur
  'cml236hqo0003t8fz1elc0uop': { lat: -6.2088, lng: 106.8456 },  // Jakarta
  'cml236hs20004t8fzhxoi4sag': { lat: 14.5995, lng: 120.9842 },  // Manila
  'cml236htg0005t8fz8k23omf0': { lat: 10.8231, lng: 106.6297 },  // Ho Chi Minh City
  'cml236huw0006t8fze4dmpnmt': { lat: -8.6500, lng: 115.2167 },  // Bali (Canggu area)
}

// Small random offset so community pins don't stack
function jitter(base: number, range: number = 0.015): number {
  return base + (Math.random() - 0.5) * range
}

async function main() {
  const communities = await prisma.community.findMany({
    where: { latitude: null },
    select: { id: true, name: true, cityId: true },
  })

  console.log(`Found ${communities.length} communities without coordinates\n`)

  let updated = 0
  for (const c of communities) {
    const center = c.cityId ? CITY_COORDS[c.cityId] : CITY_COORDS['cml236hkw0000t8fze8orkybl'] // default to SG
    if (!center) {
      console.log(`SKIP (no city coords): ${c.name}`)
      continue
    }

    await prisma.community.update({
      where: { id: c.id },
      data: {
        latitude: jitter(center.lat),
        longitude: jitter(center.lng),
      },
    })

    console.log(`UPDATED: ${c.name} → (${center.lat.toFixed(2)}, ${center.lng.toFixed(2)}) + jitter`)
    updated++
  }

  console.log(`\nDone. Updated: ${updated}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
