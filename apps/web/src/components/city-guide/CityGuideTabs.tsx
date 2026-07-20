import Link from 'next/link'
import { CalendarDays, Map, MapPin, Users } from 'lucide-react'

type CityGuideTab = 'places' | 'events' | 'communities' | 'map'

const tabs: Array<{
  id: CityGuideTab
  label: string
  href: string
  icon: typeof MapPin
}> = [
  { id: 'places', label: 'Places', href: '/singapore', icon: MapPin },
  { id: 'events', label: 'Events', href: '/buddy?city=singapore', icon: CalendarDays },
  { id: 'communities', label: 'Communities', href: '/communities?city=singapore', icon: Users },
  { id: 'map', label: 'Map', href: '/buddy?view=map&city=singapore', icon: Map },
]

export function CityGuideTabs({ active }: { active: CityGuideTab }) {
  return (
    <nav
      aria-label="Singapore guide sections"
      className="border-b border-white/10 bg-[#0B0B0B]/96 backdrop-blur-xl"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 py-3 sm:flex sm:overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-11 min-w-0 shrink-0 items-center justify-center gap-2 rounded-full px-3 text-xs font-black uppercase tracking-wide transition-colors ${
                isActive
                  ? 'bg-white text-black'
                  : 'border border-white/12 text-white/62 hover:border-[#63FF8F] hover:text-[#63FF8F]'
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
