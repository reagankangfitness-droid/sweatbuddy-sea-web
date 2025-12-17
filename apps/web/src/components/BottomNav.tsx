'use client'

import { Home, Search, Heart, PlusCircle, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { id: 'home', label: 'Home', icon: Home, href: '/', isHash: false },
  { id: 'explore', label: 'Explore', icon: Search, href: '#events', isHash: true },
  { id: 'submit', label: 'Submit', icon: PlusCircle, href: '#submit', isHash: true, isAction: true },
  { id: 'saved', label: 'Saved', icon: Heart, href: '/saved', isHash: false },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile', isHash: false },
]

export function BottomNav() {
  const pathname = usePathname()

  const handleHashClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <>
      {/* Spacer to prevent content being hidden behind nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur */}
        <div className="absolute inset-0 bg-cream/95 backdrop-blur-lg border-t border-forest-200" />

        {/* Safe area padding for iOS */}
        <div className="relative flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (!item.isHash && item.href !== '/' && pathname.startsWith(item.href))
            const Icon = item.icon

            // Special "Submit" button in center
            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleHashClick(item.href)}
                  className="relative -mt-6"
                >
                  <div className="w-14 h-14 bg-coral rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </button>
              )
            }

            // Hash links use button, regular links use Link
            if (item.isHash) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleHashClick(item.href)}
                  className={`
                    flex flex-col items-center justify-center
                    w-16 h-14
                    transition-colors relative
                    ${isActive
                      ? 'text-coral'
                      : 'text-forest-400 active:text-forest-600'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                </button>
              )
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center
                  w-16 h-14
                  transition-colors relative
                  ${isActive
                    ? 'text-coral'
                    : 'text-forest-400 active:text-forest-600'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-1 w-4 h-1 bg-coral rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
