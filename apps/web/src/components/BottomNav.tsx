'use client'

import { Users, CalendarDays, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const navItems = [
  { id: 'community', label: 'Community', icon: Users, href: '/community' },
  { id: 'events', label: 'Events', icon: CalendarDays, href: '/events' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <>
      {/* Spacer */}
      <div className="h-20 md:hidden" />

      <nav
        role="navigation"
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      >
        <div className="absolute inset-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-200 dark:border-neutral-800" />

        <div className="relative flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href)
            const Icon = item.icon

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex flex-col items-center justify-center
                  w-16 h-14
                  transition-all duration-200 relative
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 rounded-lg
                  ${isActive
                    ? 'text-neutral-900 dark:text-white'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 active:scale-95'
                  }
                `}
              >
                <Icon className={`w-6 h-6 transition-all duration-200 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>

                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute bottom-1 w-4 h-1 bg-neutral-900 dark:bg-white rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
