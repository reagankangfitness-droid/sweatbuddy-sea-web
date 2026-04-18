import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, MapPin, Users, Calendar } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export const metadata: Metadata = {
  title: 'Cities | SweatBuddies',
  description: 'Find fitness events and communities in Singapore, Bangkok, and across Southeast Asia.',
  openGraph: {
    title: 'Cities | SweatBuddies',
    description: 'Find fitness events and communities across Southeast Asia.',
    url: 'https://www.sweatbuddies.co/cities',
  },
}

const cityEmojis: Record<string, string> = {
  singapore: '🇸🇬',
  bangkok: '🇹🇭',
  'kuala-lumpur': '🇲🇾',
  jakarta: '🇮🇩',
  manila: '🇵🇭',
  hcmc: '🇻🇳',
  bali: '🏝️',
}

const cityImages: Record<string, string> = {
  singapore: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800',
  bangkok: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800',
  'kuala-lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800',
  jakarta: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800',
}

async function getCities() {
  const cities = await prisma.city.findMany({
    orderBy: [
      { isLaunched: 'desc' },
      { communityCount: 'desc' },
    ],
  })
  return cities
}

export default async function CitiesPage() {
  const cities = await getCities()
  const launchedCities = cities.filter(c => c.isLaunched)
  const comingSoonCities = cities.filter(c => !c.isLaunched)

  return (
    <div className="min-h-screen bg-[#0D0D0D]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-[#333333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-[#666666] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-white">
              sweatbuddies
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-white mb-4">
            SweatBuddies Cities
          </h1>
          <p className="text-lg text-[#666666] max-w-2xl mx-auto">
            Find fitness events and communities across Southeast Asia. Pick your city to explore.
          </p>
        </div>
      </section>

      {/* Launched Cities */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-medium text-[#666666] uppercase tracking-wider mb-6">
            Now Live
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {launchedCities.map((city) => (
              <Link
                key={city.slug}
                href={`/cities/${city.slug}`}
                className="group relative overflow-hidden rounded-2xl aspect-[16/9]"
              >
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 to-neutral-900">
                  {cityImages[city.slug] && (
                    <Image
                      src={cityImages[city.slug]}
                      alt={city.name}
                      fill
                      className="object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                    />
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-6 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-3xl">{cityEmojis[city.slug] || '🌏'}</span>
                    <h3 className="text-2xl sm:text-3xl font-bold">{city.name}</h3>
                  </div>
                  <p className="text-white/80 mb-4">{city.country}</p>

                  <div className="flex items-center gap-4 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {city.communityCount} communities
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {city.eventCount} events
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-[#1A1A1A]/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Coming Soon Cities */}
      {comingSoonCities.length > 0 && (
        <section className="pb-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-sm font-medium text-[#666666] uppercase tracking-wider mb-6">
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {comingSoonCities.map((city) => (
                <div
                  key={city.slug}
                  className="bg-[#1A1A1A] rounded-xl p-5 text-center"
                >
                  <span className="text-3xl mb-2 block">{cityEmojis[city.slug] || '🌏'}</span>
                  <h3 className="font-semibold text-white">{city.name}</h3>
                  <p className="text-sm text-[#666666] mt-1">{city.country}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-[#1A1A1A]">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-semibold text-2xl text-white mb-3">
            Want SweatBuddies in your city?
          </h2>
          <p className="text-[#666666] mb-6">
            We&apos;re expanding across Southeast Asia. Let us know where you&apos;d like us next!
          </p>
          <a
            href="mailto:hello@sweatbuddies.co?subject=Bring%20SweatBuddies%20to%20my%20city"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] text-white rounded-full font-semibold hover:bg-[#2A2A2A] transition-colors"
          >
            Request Your City
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </div>
  )
}
