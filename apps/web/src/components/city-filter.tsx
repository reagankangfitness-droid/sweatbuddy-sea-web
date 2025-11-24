'use client'

import { Button } from '@/components/ui/button'

interface Activity {
  city: string
  type: string
}

const CITY_EMOJI_MAP: Record<string, string> = {
  'singapore': '🇸🇬',
  'bangkok': '🇹🇭',
  'kuala lumpur': '🇲🇾',
  'kl': '🇲🇾',
  'manila': '🇵🇭',
  'jakarta': '🇮🇩',
  'ho chi minh city': '🇻🇳',
  'hcmc': '🇻🇳',
  'hanoi': '🇻🇳',
  'bali': '🇮🇩',
  'phuket': '🇹🇭',
  'chiang mai': '🇹🇭',
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Types', emoji: '' },
  { value: 'RUN', label: 'Run', emoji: '🏃' },
  { value: 'GYM', label: 'Gym', emoji: '💪' },
  { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
  { value: 'HIKE', label: 'Hike', emoji: '🥾' },
  { value: 'CYCLING', label: 'Cycling', emoji: '🚴' },
  { value: 'OTHER', label: 'Other', emoji: '✨' },
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
    label: city === 'all' ? 'All Cities' : city,
    emoji: city === 'all' ? '' : CITY_EMOJI_MAP[city.toLowerCase()] || '🌏'
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
    <div className="flex flex-col gap-6">
      {/* City Filter */}
      <div className="filter-section">
        <label className="text-sm font-semibold mb-3 block text-foreground">City</label>
        <div className="flex flex-row gap-3 overflow-x-auto overflow-y-hidden pb-2 -mb-2 filter-pills-scroll">
          {cityOptions.map((city) => (
            <Button
              key={city.value}
              variant={selectedCity === city.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleCitySelect(city.value)}
              className="rounded-pill whitespace-nowrap flex-shrink-0"
            >
              {city.emoji && (
                <span role="img" aria-label={city.label} className="mr-1.5">
                  {city.emoji}
                </span>
              )}
              {city.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Activity Type Filter */}
      <div className="filter-section">
        <label className="text-sm font-semibold mb-3 block text-foreground">Activity Type</label>
        <div className="flex flex-row gap-3 overflow-x-auto overflow-y-hidden pb-2 -mb-2 filter-pills-scroll">
          {ACTIVITY_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={selectedType === type.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleTypeSelect(type.value)}
              className="rounded-pill whitespace-nowrap flex-shrink-0"
            >
              {type.emoji && (
                <span role="img" aria-label={type.label} className="mr-1.5">
                  {type.emoji}
                </span>
              )}
              {type.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { ActivityFilter as CityFilter }
