'use client'

import { useState, useEffect, Suspense } from 'react'
import { Compass, User, Users2, Plus, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Logo } from '@/components/logo'
import { useUser } from '@clerk/nextjs'
import Image from 'next/image'
import { CreateSessionSheet } from '@/components/CreateSessionSheet'

const navItems = [
  { id: 'discover', label: 'Discover', icon: Compass, href: '/buddy', mobileOnly: false },
  { id: 'communities', label: 'Explore', icon: Users2, href: '/communities', mobileOnly: false },
  { id: 'create', label: 'Create', icon: Plus, href: '#', mobileOnly: true, isCreate: true },
  { id: 'hub', label: 'Hub', icon: LayoutDashboard, href: '/hub', mobileOnly: false },
  { id: 'profile', label: 'Profile', icon: User, href: '/profile', mobileOnly: false },
]

// Wrap export in Suspense boundary for client-side navigation hooks
export function AppNav() {
  return (
    <Suspense fallback={null}>
      <AppNavInner />
    </Suspense>
  )
}

function AppNavInner() {
  const pathname = usePathname()
  const { user, isSignedIn } = useUser()
  const [isHovered, setIsHovered] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    if (!isSignedIn) return
    fetch('/api/p2p/payments/pending')
      .then((r) => (r.ok ? r.json() : { payments: [] }))
      .then((data) => setPendingCount(data.payments?.length ?? 0))
      .catch(() => {})
  }, [isSignedIn])

  // Only show on main browsing pages — NOT on detail/edit/form pages with their own action bars
  const isAppPage =
    pathname === '/buddy' ||
    pathname.startsWith('/buddy?') ||
    pathname.startsWith('/discover') ||
    pathname === '/profile' ||
    pathname.startsWith('/my-bookings') ||
    pathname.startsWith('/communities') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/user') ||
    pathname.startsWith('/saved') ||
    pathname.startsWith('/hub')

  // Hide on pages with their own fixed action bars (prevents overlap)
  const hasOwnActionBar =
    pathname.match(/^\/activities\/[^/]+$/) || // activity detail
    pathname.match(/^\/activities\/[^/]+\/edit/) || // activity edit
    pathname.startsWith('/buddy/host/new') || // full session creation
    pathname.startsWith('/buddy/host/quick') || // quick post
    pathname.startsWith('/onboarding') || // onboarding flows
    pathname.startsWith('/communities/create') || // community creation
    pathname.match(/^\/e\/[^/]+$/) || // event detail
    pathname.match(/^\/event\/[^/]+$/) // event detail

  if (!isAppPage || hasOwnActionBar) return null

  function isActive(item: (typeof navItems)[0]) {
    if (item.id === 'discover') {
      return pathname.startsWith('/buddy') || pathname.startsWith('/discover')
    }
    if (item.id === 'communities') {
      return pathname.startsWith('/communities')
    }
    if (item.id === 'hub') {
      return pathname.startsWith('/hub')
    }
    if (item.id === 'profile') {
      return pathname.startsWith('/profile')
    }
    return pathname.startsWith(item.href)
  }

  const sidebarItems = navItems.filter((i) => !i.mobileOnly)

  return (
    <>
      {/* Desktop Hover-Reveal Sidebar */}
      <div
        className="hidden md:block fixed left-0 top-0 bottom-0 z-30"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute left-0 top-0 bottom-0 w-4 z-10" />

        {/* Collapsed indicator strip */}
        <motion.div
          initial={false}
          animate={{ opacity: isHovered ? 0 : 1 }}
          transition={{ duration: 0.15 }}
          className="absolute left-0 top-0 bottom-0 w-12 flex flex-col items-center py-6 bg-[#0D0D0D]/80 backdrop-blur-sm border-r border-white/[0.06]"
        >
          <div className="mb-6">
            <Logo size={24} />
          </div>
          <div className="flex flex-col items-center gap-3 flex-1">
            {sidebarItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              return (
                <div
                  key={item.id}
                  className={`relative w-8 h-8 rounded-lg flex items-center justify-center ${
                    active ? 'bg-white text-black' : 'text-[#71717A]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.id === 'discover' && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center leading-none">
                      {pendingCount > 9 ? '9' : pendingCount}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-auto">
            <button
              onClick={() => setCreateOpen(true)}
              className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:opacity-90 transition-opacity"
              aria-label="Create session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Expanded sidebar */}
        <AnimatePresence>
          {isHovered && (
            <motion.nav
              role="navigation"
              aria-label="App navigation"
              initial={{ x: -80, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute left-0 top-0 bottom-0 w-20 flex flex-col items-center py-6 bg-[#0D0D0D]/95 backdrop-blur-xl border-r border-white/[0.06] shadow-xl"
            >
              <Link href="/" className="mb-8" title="Home">
                <Logo size={32} />
              </Link>

              <div className="flex flex-col items-center gap-2 flex-1">
                {sidebarItems.map((item) => {
                  const active = isActive(item)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={`
                        relative flex flex-col items-center justify-center
                        w-14 h-14 rounded-xl transition-all duration-200
                        ${active
                          ? 'text-white bg-white/10'
                          : 'text-[#71717A] hover:text-[#999999] hover:bg-white/[0.04]'
                        }
                      `}
                    >
                      {active && (
                        <motion.div
                          layoutId="desktopSidebarIndicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                      <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : ''}`} />
                      <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                      {item.id === 'discover' && pendingCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center leading-none">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Create button */}
              <div className="mb-4">
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-black hover:opacity-90 transition-opacity shadow-lg"
                  aria-label="Create session"
                >
                  <Plus className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </div>

              {/* User avatar */}
              <div className="mt-auto">
                {isSignedIn && user ? (
                  <Link
                    href="/profile"
                    className="block w-10 h-10 rounded-full overflow-hidden border-2 border-white/[0.06] hover:border-white/[0.12] transition-colors"
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
                      <div className="w-full h-full bg-[#1A1A1A] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#71717A]" />
                      </div>
                    )}
                  </Link>
                ) : (
                  <Link
                    href="/sign-in"
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:opacity-90 transition-opacity"
                    title="Sign In"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <nav
          role="navigation"
          aria-label="Main navigation"
          className="fixed bottom-0 left-0 right-0 z-30"
        >
          <div className="absolute inset-0 bg-[#0D0D0D]/95 backdrop-blur-xl border-t border-white/[0.06]" />
          <div className="relative flex items-center justify-around px-2 pt-2 pb-[env(safe-area-inset-bottom,8px)]">
            {navItems.map((item) => {
              const active = isActive(item)
              const Icon = item.icon
              const isCreateBtn = 'isCreate' in item && item.isCreate

              if (isCreateBtn) {
                return (
                  <button
                    key={item.id}
                    onClick={() => setCreateOpen(true)}
                    aria-label="Create session"
                    className="flex flex-col items-center justify-center w-14 h-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D] rounded-lg"
                  >
                    <span className="flex items-center justify-center w-11 h-11 rounded-full bg-white">
                      <Plus className="w-6 h-6 text-black stroke-[2.5px]" />
                    </span>
                  </button>
                )
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                  className={`
                    flex flex-col items-center justify-center w-14 h-14
                    transition-all duration-200 relative
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D] rounded-lg
                    ${active ? 'text-white' : 'text-[#71717A] active:scale-95'}
                  `}
                >
                  <span className="relative">
                    <Icon className={`w-6 h-6 transition-all duration-200 ${active ? 'stroke-[2.5px]' : ''}`} />
                    {item.id === 'discover' && pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center leading-none">
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="mobileActiveIndicator"
                      className="absolute bottom-1 w-4 h-1 bg-white rounded-full"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Create Session Sheet */}
      <CreateSessionSheet open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}
