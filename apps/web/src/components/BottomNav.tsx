'use client'

import { useEffect, useCallback } from 'react'
import { Home, Search, Heart, PlusCircle, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const navItems = [
  { id: 'home', label: 'Home', icon: Home, href: '/', isHash: false },
  { id: 'explore', label: 'Explore', icon: Search, href: '#events', isHash: true },
  { id: 'submit', label: 'Submit', icon: PlusCircle, href: '#submit-mobile', isHash: true, isAction: true },
  { id: 'saved', label: 'Saved', icon: Heart, href: '/saved', isHash: false },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile', isHash: false },
]

// Helper to scroll to element with retry for dynamic content
const scrollToElement = (elementId: string, maxAttempts = 10) => {
  let attempts = 0

  const tryScroll = () => {
    const element = document.getElementById(elementId)
    if (element) {
      // Add offset for fixed header
      const headerOffset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
      return true
    }

    attempts++
    if (attempts < maxAttempts) {
      setTimeout(tryScroll, 100)
    }
    return false
  }

  tryScroll()
}

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Handle hash on page load/navigation
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.slice(1)
      // Small delay to ensure dynamic content is loaded
      setTimeout(() => scrollToElement(hash), 300)
    }
  }, [pathname])

  const handleHashClick = useCallback((href: string) => {
    if (href.startsWith('#')) {
      const elementId = href.slice(1)

      if (pathname === '/') {
        // On home page, scroll to element (with retry for dynamic content)
        scrollToElement(elementId)
      } else {
        // On different page, navigate to home with hash
        router.push('/' + href)
      }
    }
  }, [pathname, router])

  return (
    <>
      {/* Spacer to prevent content being hidden behind nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        {/* Background with blur */}
        <div className="absolute inset-0 bg-white/95 backdrop-blur-lg border-t border-neutral-200" />

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
                  <div className="w-14 h-14 bg-neutral-900 rounded-full flex items-center justify-center shadow-lg">
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
                      ? 'text-neutral-900'
                      : 'text-neutral-400 active:text-neutral-600'
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
                    ? 'text-neutral-900'
                    : 'text-neutral-400 active:text-neutral-600'
                  }
                `}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5px]' : ''}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute bottom-1 w-4 h-1 bg-neutral-900 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
