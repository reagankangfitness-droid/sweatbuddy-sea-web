'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useClerk, useUser } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Mail,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  ChevronLeft,
  Loader2,
  Lock,
  UserPlus,
  Flag,
  Activity,
  Building2,
  MapPin,
  Search,
  Inbox
} from 'lucide-react'
import { Logo } from '@/components/logo'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Sessions', href: '/admin/sessions', icon: Activity },
  { name: 'Activities', href: '/admin/activities', icon: Clock },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
  { name: 'Communities', href: '/admin/communities', icon: Building2 },
  { name: 'Place Review', href: '/admin/places', icon: MapPin },
  { name: 'Nominations', href: '/admin/nominations', icon: Inbox },
  { name: 'Discovery', href: '/admin/discovery', icon: Search },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Hosts', href: '/admin/hosts', icon: UserPlus },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthed, setIsAuthed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { isSignedIn, user } = useUser()

  // Check if already authenticated via API
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/admin/auth')
        if (res.ok) {
          const data = await res.json()
          setIsAuthed(data.authenticated)
        } else {
          setIsAuthed(false)
        }
      } catch {
        setIsAuthed(false)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
    } catch {
      // Ignore errors
    }
    setIsAuthed(false)
    await signOut({ redirectUrl: '/' })
  }

  const handleSwitchAccount = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
    } catch {
      // Ignore errors
    }
    setIsAuthed(false)
    await signOut({ redirectUrl: `/sign-in?redirect_url=${encodeURIComponent('/admin')}` })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  // If the Clerk user is not an admin, show an access-restricted state.
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-neutral-950 p-8 rounded-2xl border border-neutral-800 shadow-lg max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-800 rounded-full mb-4">
              <Lock className="w-8 h-8 text-neutral-400" />
            </div>
            <h1 className="font-semibold text-xl text-neutral-100">
              {isSignedIn ? 'Account is not an admin' : 'Admin access required'}
            </h1>
            <p className="text-neutral-500 text-sm mt-2">
              {isSignedIn
                ? 'This signed-in account is not in the admin allowlist.'
                : 'Sign in with a Clerk account listed in ADMIN_USER_IDS.'}
            </p>
          </div>

          {isSignedIn && (
            <div className="mb-4 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-400">
              <p className="truncate">Email: {user?.primaryEmailAddress?.emailAddress ?? 'unknown'}</p>
              <p className="mt-1 break-all">Clerk ID: {user?.id ?? 'unknown'}</p>
            </div>
          )}

          {isSignedIn ? (
            <button
              onClick={handleSwitchAccount}
              className="block w-full rounded-lg bg-white py-3 text-center text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-200"
            >
              Switch account
            </button>
          ) : (
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(pathname || '/admin')}`}
              className="block rounded-lg bg-white py-3 text-center text-sm font-semibold text-neutral-900 transition-all hover:bg-neutral-200"
            >
              Sign in to admin
            </Link>
          )}
          <Link
            href="/"
            className="mt-3 block rounded-lg border border-neutral-800 py-3 text-center text-sm font-semibold text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100"
          >
            Back to site
          </Link>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-neutral-800 py-3 text-sm font-semibold text-neutral-400 transition-colors hover:border-neutral-600 hover:text-neutral-100"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-neutral-950 border-r border-neutral-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-semibold text-neutral-100">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-white text-neutral-900'
                    : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-700 hover:bg-red-950 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-neutral-950/95 backdrop-blur-lg border-b border-neutral-800 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-400 hover:text-neutral-100 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-semibold text-neutral-100 text-sm">Admin</span>
            </Link>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}
