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
      {/* Hero Section with Video Background */}
      <div className="relative w-full min-h-[600px] md:min-h-[700px] -mt-8 mb-16 overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

        {/* Hero Content */}
        <div className="relative z-10 max-w-container mx-auto px-8 py-28 md:py-36 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold mb-6 text-white leading-tight max-w-[900px] mx-auto" style={{
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
            letterSpacing: '-0.02em',
            lineHeight: '1.2'
          }}>
            Discover fitness retreats, meet new friends, and build real connections.
          </h1>
          <p className="text-lg md:text-xl text-white/95 mb-12 leading-relaxed max-w-[700px] mx-auto" style={{
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
            lineHeight: '1.5'
          }}>
            Book retreats that push you forward—and connect with people who'll keep you accountable long after you get home.
          </p>

          {/* Feature Box */}
          <div className="max-w-[800px] mx-auto mb-12 rounded-2xl border border-white/20 bg-white/15 backdrop-blur-[10px] p-8 md:p-10 shadow-glass">
            <ul className="text-left space-y-5">
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-lg flex-shrink-0" style={{ color: '#FFA51F' }}>•</span>
                <span className="text-white text-base md:text-[17px] leading-relaxed">
                  Discover curated wellness retreats hosted by passionate communities—from weekend Hyrox camps to mindfulness getaways across Southeast Asia.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-lg flex-shrink-0" style={{ color: '#FFA51F' }}>•</span>
                <span className="text-white text-base md:text-[17px] leading-relaxed">
                  Connect with committed people who show up, push through, and become your accountability crew beyond the retreat.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 text-lg flex-shrink-0" style={{ color: '#FFA51F' }}>•</span>
                <span className="text-white text-base md:text-[17px] leading-relaxed">
                  sweatbuddies is where transformation meets lasting friendship—retreat together, grow together, and build a support system that sticks.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/activities/new">
              <Button size="lg" className="shadow-button-glow hover:shadow-button-glow-hover">
                Create Activity
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 hover:border-white/60 shadow-glass">
                My Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-8 py-12 md:py-20">

        {/* Explore Retreats Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-black">Explore Retreats</h2>
            <p className="text-base text-gray-500 mb-4 leading-relaxed">
              Discover wellness retreats and fitness experiences across Southeast Asia
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
              <p className="text-muted-foreground">Loading activities...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
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
