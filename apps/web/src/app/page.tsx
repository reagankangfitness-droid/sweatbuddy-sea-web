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
      <main className="container mx-auto p-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 text-black">SweatBuddies</h1>
          <p className="text-lg md:text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl mx-auto">
            Find local workouts, wellness hangs, and health-obsessed people who actually get it.
          </p>

          {/* Feature Box */}
          <div className="max-w-3xl mx-auto mb-8 rounded-lg border bg-card p-6 shadow-sm">
            <ul className="text-left space-y-3">
              <li className="flex items-start">
                <span className="mr-3 mt-1 text-gray-800">•</span>
                <span className="text-gray-800 leading-relaxed">Find local workouts and wellness hangs hosted by your community.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1 text-gray-800">•</span>
                <span className="text-gray-800 leading-relaxed">Connect with health-obsessed people in your area who actually show up and keep you consistent.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1 text-gray-800">•</span>
                <span className="text-gray-800 leading-relaxed">SweatBuddies is where wellness meets real friendship—move better, meet your people, and build something that lasts.</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/activities/new">
              <Button size="lg" className="font-semibold">
                + Create Activity
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="font-semibold">
                My Dashboard
              </Button>
            </Link>
          </div>
        </div>

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
