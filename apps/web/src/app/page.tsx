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
        <div className="relative z-10 max-w-container mx-auto px-8 py-24 md:py-32 text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            SweatBuddies
          </h1>
          <p className="text-xl md:text-2xl text-white/95 mb-10 leading-relaxed max-w-3xl mx-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
            Find local workouts, wellness hangs, and health-obsessed people who actually get it.
          </p>

          {/* Feature Box */}
          <div className="max-w-3xl mx-auto mb-12 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-8 shadow-2xl">
            <ul className="text-left space-y-4">
              <li className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span className="text-white/95 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Find local workouts and wellness hangs hosted by your community.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span className="text-white/95 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Connect with health-obsessed people in your area who actually show up and keep you consistent.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>
                <span className="text-white/95 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  SweatBuddies is where wellness meets real friendship—move better, meet your people, and build something that lasts.
                </span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/activities/new">
              <Button size="lg" className="shadow-xl">
                Create Activity
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 hover:border-white/60 shadow-xl">
                My Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <main className="container mx-auto p-8">

        {/* Explore Activities Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-black">Explore Activities</h2>
            <p className="text-base text-gray-500 mb-4 leading-relaxed">
              Discover workout experiences in Southeast Asia
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
