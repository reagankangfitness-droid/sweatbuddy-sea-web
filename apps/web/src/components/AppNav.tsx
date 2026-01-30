'use client'

import { Map, Users, User } from 'lucide-react'
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
      {/* Desktop Top Nav - hidden on mobile */}
      <nav
        role="navigation"
        aria-label="App navigation"
        className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg border-b border-neutral-200 dark:border-neutral-800"
      >
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-semibold text-neutral-900 dark:text-white">sweatbuddies</span>
          </Link>

          {/* Center Nav Links */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-full p-1">
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
                    relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'text-neutral-900 dark:text-white'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }
                  `}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktopActiveIndicator"
                      className="absolute inset-0 bg-white dark:bg-neutral-700 rounded-full shadow-sm"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Right Side - User Avatar */}
          <div className="flex items-center gap-3">
            {isSignedIn && user ? (
              <Link href="/profile" className="flex items-center gap-2">
                {user.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || 'Profile'}
                    width={36}
                    height={36}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                    <User className="w-5 h-5 text-neutral-500" />
                  </div>
                )}
              </Link>
            ) : (
              <Link
                href="/sign-in"
                className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Desktop spacer */}
      <div className="hidden md:block h-16" />

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
