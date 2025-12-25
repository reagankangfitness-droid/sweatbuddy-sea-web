'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  ChevronLeft
} from 'lucide-react'
import { Logo } from '@/components/logo'

const ADMIN_SECRET = 'sweatbuddies-admin-2024'

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
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const storedAuth = localStorage.getItem('admin-auth')
    setIsAuthed(storedAuth === ADMIN_SECRET)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('admin-auth')
    setIsAuthed(false)
    router.push('/admin/login')
  }

  // Show loading state while checking auth
  if (isAuthed === null) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // If on login page, just show children
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // If not authed and not on login page, redirect to login
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl border border-neutral-200 shadow-lg max-w-sm w-full text-center">
          <h1 className="font-semibold text-xl text-neutral-900 mb-4">Admin Access Required</h1>
          <p className="text-neutral-500 text-sm mb-6">Please log in to access the admin dashboard.</p>
          <Link
            href="/admin/login"
            className="inline-block w-full bg-neutral-900 text-white py-3 rounded-lg font-semibold hover:bg-neutral-700 transition-all"
          >
            Go to Login
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
