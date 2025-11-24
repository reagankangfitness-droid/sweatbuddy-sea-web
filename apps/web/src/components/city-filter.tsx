'use client'

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
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      {/* City Filter */}
      <div className="filter-section flex-1">
        <label className="font-semibold mb-2 block text-foreground" style={{ fontSize: '13px' }}>City</label>
        <Select value={selectedCity} onValueChange={handleCitySelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {cityOptions.map((city) => (
              <SelectItem key={city.value} value={city.value}>
                <div className="flex items-center gap-2">
                  {city.emoji && (
                    <span role="img" aria-label={city.label}>
                      {city.emoji}
                    </span>
                  )}
                  <span>{city.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Activity Type Filter */}
      <div className="filter-section flex-1">
        <label className="font-semibold mb-2 block text-foreground" style={{ fontSize: '13px' }}>Activity Type</label>
        <Select value={selectedType} onValueChange={handleTypeSelect}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select activity type" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {ACTIVITY_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  {type.emoji && (
                    <span role="img" aria-label={type.label}>
                      {type.emoji}
                    </span>
                  )}
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

export { ActivityFilter as CityFilter }
