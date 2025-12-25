import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { getEvents } from '@/lib/events'

export const metadata: Metadata = {
  title: 'All Fitness Events in Singapore | SweatBuddies',
  description: 'Browse all fitness events in Singapore. Run clubs, yoga, HIIT, bootcamp, dance, meditation and more. No memberships, just show up.',
  openGraph: {
    title: 'Fitness Events in Singapore | SweatBuddies',
    description: 'Browse all fitness events in Singapore. No memberships, just show up.',
    url: 'https://www.sweatbuddies.co/events',
  },
}

const categories = [
  { slug: 'run-club', title: 'Run Club', emoji: '🏃', color: 'from-amber-400 to-orange-500' },
  { slug: 'yoga', title: 'Yoga', emoji: '🧘', color: 'from-blue-400 to-indigo-500' },
  { slug: 'hiit', title: 'HIIT', emoji: '🔥', color: 'from-red-400 to-rose-500' },
  { slug: 'bootcamp', title: 'Bootcamp', emoji: '💪', color: 'from-orange-400 to-amber-500' },
  { slug: 'dance', title: 'Dance', emoji: '💃', color: 'from-pink-400 to-rose-500' },
  { slug: 'meditation', title: 'Meditation', emoji: '🧘', color: 'from-indigo-400 to-purple-500' },
  { slug: 'outdoor', title: 'Outdoor', emoji: '🌳', color: 'from-green-400 to-emerald-500' },
  { slug: 'combat', title: 'Combat', emoji: '🥊', color: 'from-red-500 to-red-600' },
  { slug: 'swimming', title: 'Swimming', emoji: '🏊', color: 'from-cyan-400 to-blue-500' },
  { slug: 'cycling', title: 'Cycling', emoji: '🚴', color: 'from-lime-400 to-green-500' },
  { slug: 'social', title: 'Social', emoji: '🎉', color: 'from-purple-400 to-pink-500' },
]

export default async function EventsPage() {
  const events = await getEvents()

  // Count events per category
  const categoryCounts = events.reduce((acc, event) => {
    const cat = event.category.toLowerCase().replace(/\s+/g, '-')
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/"
              className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Home</span>
            </Link>
            <Link href="/" className="font-sans font-bold text-xl text-neutral-900">
              sweatbuddies
            </Link>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="font-sans font-bold text-4xl sm:text-5xl text-neutral-900 mb-4">
            Explore by Category
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            {events.length}+ fitness events happening in Singapore this week. Find your tribe.
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categories.map((category) => {
              const count = categoryCounts[category.slug] || 0

              return (
                <Link
                  key={category.slug}
                  href={`/events/${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square"
                >
                  {/* Gradient Background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-90 group-hover:opacity-100 transition-opacity`} />

                  {/* Content */}
                  <div className="relative h-full flex flex-col items-center justify-center p-4 text-white">
                    <span className="text-5xl sm:text-6xl mb-3 group-hover:scale-110 transition-transform">
                      {category.emoji}
                    </span>
                    <h2 className="font-semibold text-lg sm:text-xl text-center">
                      {category.title}
                    </h2>
                    <p className="text-white/80 text-sm mt-1">
                      {count} event{count !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-white" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Browse All CTA */}
      <section className="py-16 bg-neutral-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-semibold text-2xl text-neutral-900 mb-3">
            Want to see everything?
          </h2>
          <p className="text-neutral-600 mb-6">
            Browse all {events.length}+ events on our homepage.
          </p>
          <Link
            href="/#events"
            className="inline-flex items-center gap-2 px-8 py-4 bg-neutral-900 text-white rounded-full font-semibold hover:bg-neutral-800 transition-colors"
          >
            Browse All Events
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}
