'use client'

import { Header } from '@/components/header'
import { ActivityFeed } from '@/components/activity-feed'
import { ActivityFilter } from '@/components/city-filter'
import Link from 'next/link'
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
      <section className="relative min-h-[85vh] md:min-h-[600px] flex items-center bg-gradient-to-br from-[#FDFCE9] to-[#FFF9E6] overflow-hidden">
        {/* Hero Container */}
        <div className="max-w-container mx-auto w-full px-6 lg:px-10 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left Column - Content */}
            <div className="text-center md:text-left order-2 md:order-1">
              {/* Tagline */}
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-4">
                Your Fitness Community
              </span>

              {/* Headline */}
              <h1 className="font-display font-bold text-foreground mb-6" style={{ fontSize: '48px', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
                <span className="block md:hidden" style={{ fontSize: '36px' }}>Find Your Sweat Squad</span>
                <span className="hidden md:block">Find Your Sweat Squad</span>
              </h1>

              {/* Description */}
              <p className="text-muted-foreground mb-8 leading-relaxed" style={{ fontSize: '17px', lineHeight: '1.6' }}>
                <span className="block md:hidden" style={{ fontSize: '16px' }}>Discover local workouts, wellness hangs, and health-obsessed people who actually show up.</span>
                <span className="hidden md:block">Discover local workouts, wellness hangs, and health-obsessed people who actually show up and keep you consistent.</span>
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center md:justify-start">
                <Link href="/activities/new">
                  <Button size="lg" className="w-full sm:w-auto shadow-premium hover:shadow-premium-hover transition-all">
                    Create Activity
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto border-2 border-foreground/20 hover:bg-foreground hover:text-background transition-all"
                  >
                    Browse Activities
                  </Button>
                </Link>
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
                  <strong className="text-foreground font-semibold">1,000+</strong> active members
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div className="order-1 md:order-2">
              <div className="relative">
                {/* Main Image Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-premium">
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-4xl">
                        🏃
                      </div>
                    </div>
                    <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden shadow-premium">
                      <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl">
                        🧘
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="relative h-32 md:h-40 rounded-2xl overflow-hidden shadow-premium">
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-4xl">
                        💪
                      </div>
                    </div>
                    <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden shadow-premium">
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl">
                        🚴
                      </div>
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

      {/* How It Works Section - TripBFF Inspired */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-container mx-auto px-6 lg:px-10">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary mb-3">
              How It Works
            </span>
            <h2 className="font-display font-bold text-foreground mb-4" style={{ fontSize: '36px', lineHeight: '1.2', letterSpacing: '-0.02em' }}>
              <span className="block md:hidden" style={{ fontSize: '28px' }}>Three Simple Steps</span>
              <span className="hidden md:block">Get Moving in Three Simple Steps</span>
            </h2>
            <p className="text-muted-foreground" style={{ fontSize: '16px', lineHeight: '1.6' }}>
              Join thousands of fitness enthusiasts finding their perfect workout partners
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">🔍</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 1
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Discover Activities
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Browse local workouts, wellness sessions, and fitness events in your area
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 2
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Join or Create
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Sign up for activities you love or host your own sessions and build your community
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="text-4xl">🎉</span>
              </div>
              <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-4">
                Step 3
              </div>
              <h3 className="font-display font-semibold text-foreground mb-3" style={{ fontSize: '20px' }}>
                Show Up & Connect
              </h3>
              <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                Meet amazing people, crush your fitness goals, and build lasting friendships
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href="/activities/new">
              <Button size="lg" className="shadow-premium hover:shadow-premium-hover transition-all">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-8 py-12 md:py-20">

        {/* Explore Activities Section - Refined typography */}
        <div>
          <div className="mb-6">
            <h2 className="font-semibold mb-2 text-black inline-flex items-center gap-2.5" style={{ fontSize: '20px', lineHeight: '1.3', letterSpacing: '-0.01em' }}>
              <span className="md:hidden"><span role="img" aria-label="sparkles">✨</span> Explore Activities</span>
              <span className="hidden md:inline" style={{ fontSize: '24px' }}><span role="img" aria-label="sparkles">✨</span> Explore Activities</span>
            </h2>
            <p className="text-gray-500 mb-4 leading-relaxed" style={{ fontSize: '14px', lineHeight: '1.5' }}>
              Discover local workouts, wellness hangs, and health experiences in your community
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
                Loading activities...
              </p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                <span role="img" aria-label="search" className="mr-2">🔍</span>
                No activities found {selectedCity !== 'all' && `in ${selectedCity.replace('-', ' ')}`}
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
