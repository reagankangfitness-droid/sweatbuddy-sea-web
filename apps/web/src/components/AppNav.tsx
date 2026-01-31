'use client'

import { Map, Users, User, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Logo } from '@/components/logo'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'

const navItems = [
  { id: 'map', label: 'Map', icon: Map, href: '/app' },
  { id: 'crews', label: 'Crews', icon: Users, href: '/crews' },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile' },
]

export function AppNav() {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()

  // Only show on app pages
  const isAppPage = pathname.startsWith('/app') || pathname === '/crews' || pathname === '/profile'
  if (!isAppPage) return null

  return (
    <>
      {/* Desktop Left Sidebar - hidden on mobile */}
      <nav
        role="navigation"
        aria-label="App navigation"
        className="hidden md:flex fixed left-0 top-0 bottom-0 z-50 w-20 flex-col items-center py-6 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-r border-neutral-200 dark:border-neutral-800"
      >
        {/* Logo - links to home */}
        <Link href="/" className="mb-8" title="Back to home">
          <Logo size={32} />
        </Link>

        {/* Nav Links */}
        <div className="flex flex-col items-center gap-2 flex-1">
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
                  relative flex flex-col items-center justify-center
                  w-14 h-14 rounded-xl
                  transition-all duration-200
                  ${isActive
                    ? 'text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-800'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktopSidebarIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-neutral-900 dark:bg-white rounded-r-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* User Avatar at bottom */}
        <div className="mt-auto">
          {isSignedIn && user ? (
            <Link
              href="/profile"
              className="block w-10 h-10 rounded-full overflow-hidden border-2 border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-500 transition-colors"
            >
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || 'Profile'}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-neutral-500" />
                </div>
              )}
            </Link>
          ) : (
            <Link
              href="/sign-in"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
              title="Sign In"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </nav>

      {/* Desktop spacer for left sidebar */}
      <div className="hidden md:block w-20 flex-shrink-0" />

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        {/* Spacer */}
        <div className="h-20" />

        <nav
          role="navigation"
          aria-label="Main navigation"
          className="fixed bottom-0 left-0 right-0 z-50"
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
                      layoutId="mobileActiveIndicator"
                      className="absolute bottom-1 w-4 h-1 bg-neutral-900 dark:bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
