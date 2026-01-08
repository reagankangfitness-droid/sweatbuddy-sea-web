'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser, SignOutButton } from '@clerk/nextjs'
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
  Loader2
} from 'lucide-react'
import { Logo } from '@/components/logo'
import { isAdminUser } from '@/lib/admin-auth-client'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Pending Events', href: '/admin/pending', icon: Clock },
  { name: 'Attendees', href: '/admin/attendees', icon: Users },
  { name: 'Newsletter', href: '/admin/newsletter', icon: Mail },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoaded } = useUser()

  // Show loading state while Clerk loads
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  // Check if user is signed in and is an admin
  const isAuthed = user && isAdminUser(user.id)

  // If not authed, show login prompt
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-lg max-w-sm w-full text-center">
          <div className="mb-6">
            <Logo size={48} />
          </div>
          <h1 className="font-semibold text-xl text-neutral-900 mb-4">Admin Access Required</h1>
          {!user ? (
            <>
              <p className="text-neutral-500 text-sm mb-6">Please sign in with an admin account to access the dashboard.</p>
              <Link
                href="/sign-in?redirect_url=/admin"
                className="inline-block w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-700 transition-all"
              >
                Sign In
              </Link>
            </>
          ) : (
            <>
              <p className="text-neutral-500 text-sm mb-6">
                Your account ({user.primaryEmailAddress?.emailAddress}) does not have admin access.
              </p>
              <Link
                href="/"
                className="inline-block w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-700 transition-all"
              >
                Go to Homepage
              </Link>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-semibold text-neutral-900">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-neutral-400 hover:text-neutral-900 transition-colors"
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
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-neutral-400 truncate">{user.primaryEmailAddress?.emailAddress}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Site</span>
          </Link>
          <SignOutButton>
            <button
              className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </SignOutButton>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-lg border-b border-neutral-200 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-semibold text-neutral-900 text-sm">Admin</span>
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
