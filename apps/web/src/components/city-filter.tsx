'use client'

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
  { value: 'all', label: 'All Types', emoji: '✨' },
  { value: 'RUN', label: 'Run', emoji: '🏃' },
  { value: 'GYM', label: 'Gym', emoji: '💪' },
  { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
  { value: 'HIKE', label: 'Hike', emoji: '🥾' },
  { value: 'CYCLING', label: 'Cycling', emoji: '🚴' },
  { value: 'COMBAT', label: 'Combat', emoji: '🥊' },
  { value: 'SWIM', label: 'Swim', emoji: '🏊' },
  { value: 'SPORTS', label: 'Sports', emoji: '🏀' },
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
    label: city === 'all' ? 'All' : city,
    emoji: city === 'all' ? '🌏' : CITY_EMOJI_MAP[city.toLowerCase()] || '🌏'
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
    <div className="space-y-5">
      {/* City Filter - Horizontal Scrollable Pills (Nomad List Style) */}
      <div className="filter-section">
        <label className="font-semibold mb-3 block text-foreground" style={{ fontSize: '13px' }}>
          City
        </label>
        <div className="relative">
          <div className="overflow-x-auto filter-pills-scroll pb-1">
            <div className="flex gap-2">
              {cityOptions.map((city) => (
                <button
                  key={city.value}
                  onClick={() => handleCitySelect(city.value)}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-pill font-medium transition-all duration-200
                    inline-flex items-center gap-2 whitespace-nowrap
                    ${selectedCity === city.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-foreground border border-border hover:border-primary/40 hover:shadow-sm'
                    }
                  `}
                  style={{ fontSize: '13px' }}
                >
                  <span role="img" aria-label={city.label}>
                    {city.emoji}
                  </span>
                  <span>{city.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Type Filter - Horizontal Scrollable Pills (Nomad List Style) */}
      <div className="filter-section">
        <label className="font-semibold mb-3 block text-foreground" style={{ fontSize: '13px' }}>
          Activity Type
        </label>
        <div className="relative">
          <div className="overflow-x-auto filter-pills-scroll pb-1">
            <div className="flex gap-2">
              {ACTIVITY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleTypeSelect(type.value)}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-pill font-medium transition-all duration-200
                    inline-flex items-center gap-2 whitespace-nowrap
                    ${selectedType === type.value
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-white text-foreground border border-border hover:border-primary/40 hover:shadow-sm'
                    }
                  `}
                  style={{ fontSize: '13px' }}
                >
                  <span role="img" aria-label={type.label}>
                    {type.emoji}
                  </span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { ActivityFilter as CityFilter }
