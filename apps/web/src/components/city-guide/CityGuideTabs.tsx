import Link from 'next/link'
import { Bookmark, CalendarDays, Map, UserRound } from 'lucide-react'

type CityGuideTab = 'places' | 'events' | 'communities' | 'map' | 'me' | 'profile'

function getTabs(citySlug?: string): Array<{
  id: CityGuideTab
  label: string
  href: string
  icon: typeof Map
}> {
  const cityQuery = citySlug ? `city=${encodeURIComponent(citySlug)}` : 'location=nearby'

  return [
    {
      id: 'communities',
      label: 'Explore',
      href: citySlug ? `/explore?city=${encodeURIComponent(citySlug)}` : '/explore',
      icon: Map,
    },
    { id: 'events', label: 'This week', href: `/this-week?${cityQuery}`, icon: CalendarDays },
    { id: 'me', label: 'My activity', href: '/me', icon: Bookmark },
    { id: 'profile', label: 'Profile', href: '/profile', icon: UserRound },
  ]
}

export function CityGuideTabs({
  active,
  citySlug,
}: {
  active: CityGuideTab
  citySlug?: string
}) {
  const tabs = getTabs(citySlug)

  return (
    <nav
      aria-label="Discovery sections"
      className="border-b border-[#17130E]/10 bg-[#F8F4EA]/94 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-4 gap-1.5 px-4 py-2.5 sm:flex sm:overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-11 min-w-0 shrink-0 items-center justify-center gap-1 rounded-full px-1.5 text-[9px] font-black uppercase tracking-wide transition-colors sm:gap-2 sm:px-3 sm:text-[10px] ${
                isActive
                  ? 'bg-[#17130E] !text-white [&_span]:!text-white [&_svg]:!text-white'
                  : 'border border-[#17130E]/10 bg-white text-[#17130E]/55 hover:border-[#17130E]/28 hover:text-[#17130E]'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
