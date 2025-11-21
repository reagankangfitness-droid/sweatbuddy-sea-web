'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Activity {
  city: string
  type: string
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'RUN', label: 'Run' },
  { value: 'GYM', label: 'Gym' },
  { value: 'YOGA', label: 'Yoga' },
  { value: 'HIKE', label: 'Hike' },
  { value: 'CYCLING', label: 'Cycling' },
  { value: 'OTHER', label: 'Other' },
]

interface ActivityFilterProps {
  activities: Activity[]
  selectedCity: string
  selectedType: string
  onCityChange: (city: string) => void
  onTypeChange: (type: string) => void
}

export function ActivityFilter({
  activities = [],
  selectedCity,
  selectedType,
  onCityChange,
  onTypeChange
}: ActivityFilterProps) {
  // Extract unique cities from activities
  const uniqueCities = ['all', ...new Set((activities || []).map(a => a.city).filter(Boolean))]
  const cityOptions = uniqueCities.map(city => ({
    value: city.toLowerCase().replace(/\s+/g, '-'),
    label: city === 'all' ? 'All Cities' : city
  }))

  const handleCitySelect = (cityValue: string) => {
    onCityChange(cityValue)
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      if (cityValue === 'all') {
        localStorage.removeItem('selectedCity')
      } else {
        localStorage.setItem('selectedCity', cityValue)
      }
    }
  }

  const handleTypeSelect = (typeValue: string) => {
    onTypeChange(typeValue)
    if (typeof window !== 'undefined') {
      if (typeValue === 'all') {
        localStorage.removeItem('selectedType')
      } else {
        localStorage.setItem('selectedType', typeValue)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* City Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">City</label>
        <div className="hidden md:flex flex-wrap gap-2">
          {cityOptions.map((city) => (
            <Button
              key={city.value}
              variant={selectedCity === city.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCitySelect(city.value)}
            >
              {city.label}
            </Button>
          ))}
        </div>
        <div className="w-full md:hidden">
          <Select value={selectedCity} onValueChange={handleCitySelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a city" />
            </SelectTrigger>
            <SelectContent>
              {cityOptions.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Activity Type Filter */}
      <div>
        <label className="text-sm font-medium mb-2 block">Activity Type</label>
        <div className="hidden md:flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeSelect(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
        <div className="w-full md:hidden">
          <Select value={selectedType} onValueChange={handleTypeSelect}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

export { ActivityFilter as CityFilter }
