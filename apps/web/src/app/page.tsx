'use client'

import { Header } from '@/components/header'
import { ActivityFeed } from '@/components/activity-feed'
import { ActivityFilter } from '@/components/city-filter'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl: string | null
  price: number
  currency: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  userActivities?: Array<{
    user: {
      id: string
      name: string | null
      imageUrl: string | null
    }
  }>
}

export default function Home() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedCity = localStorage.getItem('selectedCity')
    const savedType = localStorage.getItem('selectedType')
    if (savedCity) {
      setSelectedCity(savedCity)
    }
    if (savedType) {
      setSelectedType(savedType)
    }

    // Fetch activities
    async function fetchActivities() {
      try {
        const response = await fetch('/api/activities')
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  // Filter activities by city and type
  const filteredActivities = activities.filter(activity => {
    const cityMatch = selectedCity === 'all' || activity.city.toLowerCase().includes(selectedCity.replace('-', ' '))
    const typeMatch = selectedType === 'all' || activity.type === selectedType
    return cityMatch && typeMatch
  })

  return (
    <>
      <Header />

      {/* Hero Section - TripBFF/ClassPass Inspired Split Layout */}
      <section className="relative min-h-[75vh] md:min-h-[600px] flex items-center bg-gradient-to-br from-[#FDFCE9] to-[#FFF9E6] overflow-hidden">
        {/* Hero Container */}
        <div className="max-w-container mx-auto w-full px-4 sm:px-6 lg:px-10 py-12 sm:py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column - Content */}
            <div className="text-center md:text-left order-2 md:order-1">
              {/* Tagline */}
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                Where Movement Meets Belonging
              </span>

              {/* Headline */}
              <h1 className="font-display font-bold text-foreground mb-5 sm:mb-6" style={{ fontSize: '48px', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
                <span className="block md:hidden" style={{ fontSize: '32px' }}>Turn Sweat Into Connection</span>
                <span className="hidden md:block">Turn Sweat Into Connection</span>
              </h1>

              {/* Description */}
              <p className="text-muted-foreground mb-6 sm:mb-8 leading-relaxed" style={{ fontSize: '17px', lineHeight: '1.6' }}>
                <span className="block md:hidden" style={{ fontSize: '15px' }}>From sunrise yoga to sunset runs. Find the people who move like you.</span>
                <span className="hidden md:block">From sunrise yoga to sunset runs, your city is alive with movement. Find the activities that move you, and build real friendships through shared sweat.</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8 sm:mb-10 justify-center md:justify-start">
                <Link href="/activities/new">
                  <Button size="lg" className="w-full sm:w-auto shadow-premium hover:shadow-premium-hover transition-all">
                    Host an Activity
                  </Button>
                </Link>
                <a href="#explore">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-foreground/20 hover:bg-foreground hover:text-background transition-all"
                  >
                    Discover Workouts
                  </Button>
                </a>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 rounded-full border-3 border-white bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">A</div>
                  <div className="w-10 h-10 rounded-full border-3 border-white bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-sm font-semibold">B</div>
                  <div className="w-10 h-10 rounded-full border-3 border-white bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">C</div>
                  <div className="w-10 h-10 rounded-full border-3 border-white bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold">+</div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong className="text-foreground font-semibold">1,000+</strong> people building their crew
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="order-1 md:order-2">
              <div className="relative">
                {/* Main Image Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="relative h-40 sm:h-48 md:h-56 rounded-xl sm:rounded-2xl overflow-hidden shadow-premium">
                      <Image
                        src="/images/hero/running.png"
                        alt="Running activity"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, 25vw"
                        priority
                      />
                    </div>
                    <div className="relative h-28 sm:h-32 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden shadow-premium">
                      <Image
                        src="/images/hero/meditation.png"
                        alt="Meditation and yoga"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, 25vw"
                        priority
                      />
                    </div>
                  </div>
                  <div className="space-y-3 sm:space-y-4 pt-6 sm:pt-8">
                    <div className="relative h-28 sm:h-32 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden shadow-premium">
                      <Image
                        src="/images/hero/run-club.jpg"
                        alt="Group fitness"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, 25vw"
                        priority
                      />
                    </div>
                    <div className="relative h-40 sm:h-48 md:h-56 rounded-xl sm:rounded-2xl overflow-hidden shadow-premium">
                      <Image
                        src="/images/hero/ice-bath.webp"
                        alt="Ice bath recovery"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 768px) 50vw, 25vw"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {/* Floating Badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-premium p-4 hidden md:block">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl">✨</span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">New Activities</div>
                      <div className="text-xs text-muted-foreground">Posted daily</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/*
        ============================================
        REMOVED: "Start Moving Together" / How It Works Section
        Commented out on 2025-01-24 for cleaner UX

        Reason: Users can discover "how it works" organically
        through the experience itself. Removing this simplifies
        the page and creates a more direct path to discovery.

        To restore: uncomment this entire block
        ============================================
      */}
      {/* How It Works Section - TripBFF Inspired */}
      {/* <section className="py-16 md:py-24 bg-white">
        <div className="max-w-container mx-auto px-6 lg:px-10">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              Building Community
            </span>
            <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: '36px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              <span className="block md:hidden" style={{ fontSize: '28px' }}>Start Moving Together</span>
              <span className="hidden md:block">Start Moving Together</span>
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '1.6' }}>
              Every experience is a doorway to belonging. Here&apos;s how it works
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 1
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Discover What Moves You
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                From group runs to yoga flows, explore activities where you belong
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 2
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Join or Lead Your Crew
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Show up to existing sessions or create your own. Either way, you&apos;re building community
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 3
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Move Together, Grow Together
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                The post-workout high hits different when you&apos;re sharing it with your people
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/activities/new">
              <Button size="lg" className="shadow-premium hover:shadow-premium-hover transition-all">
                Start Building Your Crew
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/*
        ============================================
        REMOVED: "How Do You Want to Move?" Section
        Commented out on 2025-01-24 for cleaner UX

        Reason: Simplifies the user journey by reducing scrolling
        to reach actual activities. Activity type filtering already
        exists in the Explore section below.

        To restore: uncomment this entire block
        ============================================
      */}
      {/* Browse by Category Section - Airbnb Experiences Inspired */}
      {/* <section className="py-16 md:py-20 bg-white">
        <div className="max-w-container mx-auto px-6 lg:px-10">
          <div className="mb-10">
            <h2 className="font-display font-bold text-foreground mb-3" style={{ fontSize: '32px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              <span className="block md:hidden" style={{ fontSize: '24px' }}>How Do You Want to Move?</span>
              <span className="hidden md:block">How Do You Want to Move?</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl" style={{ fontSize: '15px', lineHeight: '1.6' }}>
              Pick your vibe. We&apos;ll connect you with your people
            </p>
          </div>

          <div className="relative">
            <div className="overflow-x-auto filter-pills-scroll pb-4">
              <div className="flex gap-4 md:gap-5">
                <button
                  onClick={() => setSelectedType('RUN')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🏃</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Running</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('GYM')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">💪</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Gym</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('YOGA')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-600 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🧘</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Yoga</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('HIKE')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🥾</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Hiking</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('CYCLING')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🚴</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Cycling</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('COMBAT')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🥊</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Combat</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('SWIM')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-500 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🏊</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Swimming</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setSelectedType('SPORTS')}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-44 h-52 md:w-52 md:h-60 rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <span className="text-5xl md:text-6xl mb-3">🏀</span>
                      <span className="font-semibold" style={{ fontSize: '18px' }}>Sports</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      <main id="explore" className="container mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-20">

        {/* Explore Activities Section - Refined typography */}
        <div>
          <div className="mb-6">
            <h2 className="font-semibold mb-2 text-black inline-flex items-center gap-2.5" style={{ fontSize: '20px', lineHeight: '1.3', letterSpacing: '-0.01em' }}>
              <span className="md:hidden"><span role="img" aria-label="sparkles">✨</span> Ready to Move?</span>
              <span className="hidden md:inline" style={{ fontSize: '24px' }}><span role="img" aria-label="sparkles">✨</span> Ready to Move?</span>
            </h2>
            <p className="text-gray-500 mb-4 leading-relaxed" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Join a session, build your crew, and feel the energy of moving together
            </p>

            {/* Filters */}
            <div className="mb-6">
              <ActivityFilter
                activities={activities}
                selectedCity={selectedCity}
                selectedType={selectedType}
                onCityChange={setSelectedCity}
                onTypeChange={setSelectedType}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                <span role="img" aria-label="loading" className="mr-2">⏳</span>
                Finding your crew...
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-2">
                <span role="img" aria-label="search" className="mr-2">🔍</span>
                No sessions yet{selectedCity !== 'all' && ` in ${selectedCity.replace(/-/g, ' ')}`}
              </p>
              <p className="text-sm text-muted-foreground">
                Be the first to bring your crew together
              </p>
            </div>
          ) : (
            <ActivityFeed activities={filteredActivities} />
          )}
        </div>
      </main>
    </>
  )
}
