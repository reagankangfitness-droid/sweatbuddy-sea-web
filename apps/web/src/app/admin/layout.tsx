'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Flag
} from 'lucide-react'
import { Logo } from '@/components/logo'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Events', href: '/admin/events', icon: Calendar },
  { name: 'Pending Events', href: '/admin/pending', icon: Clock },
  { name: 'Hosts', href: '/admin/hosts', icon: UserPlus },
  { name: 'Attendees', href: '/admin/attendees', icon: Users },
  { name: 'Reports', href: '/admin/reports', icon: Flag },
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
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const pathname = usePathname()

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.ok) {
        setIsAuthed(true)
        setPassword('')
      } else {
        setError('Incorrect password')
      }
    } catch {
      setError('Login failed. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' })
    } catch {
      // Ignore errors
    }
    setIsAuthed(false)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    )
  }

  // If not authed, show login form
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-lg max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-100 rounded-full mb-4">
              <Lock className="w-8 h-8 text-neutral-600" />
            </div>
            <h1 className="font-semibold text-xl text-neutral-900">Admin Login</h1>
            <p className="text-neutral-500 text-sm mt-2">Enter the admin password to continue</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              autoFocus
            />
            {error && (
              <p className="text-red-500 text-sm mb-3">{error}</p>
            )}
            <button
              type="submit"
              className="w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-700 transition-all"
            >
              Login
            </button>
          </form>

          <Link
            href="/"
            className="block text-center text-neutral-500 text-sm mt-4 hover:text-neutral-700"
          >
            ← Back to site
          </Link>
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
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium text-sm">Back to Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Logout</span>
          </button>
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
