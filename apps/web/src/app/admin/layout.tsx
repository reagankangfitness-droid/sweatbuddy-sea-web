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
      <div className="min-h-screen bg-forest-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
        <div className="bg-forest-900/80 backdrop-blur-lg p-8 rounded-2xl border border-forest-700 max-w-sm w-full text-center">
          <h1 className="font-display text-display-card text-cream mb-4">Admin Access Required</h1>
          <p className="text-body-default text-forest-400 mb-6">Please log in to access the admin dashboard.</p>
          <Link
            href="/admin/login"
            className="inline-block w-full bg-coral text-white py-3 rounded-full font-semibold text-ui-lg hover:bg-coral-600 transition-all shadow-md"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-forest-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-forest-900 border-r border-forest-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-forest-800">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo size={28} />
            <span className="font-display font-semibold text-cream">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-forest-400 hover:text-cream transition-colors"
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-coral text-white shadow-md'
                    : 'text-forest-400 hover:text-cream hover:bg-forest-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium text-ui">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-forest-800">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-forest-400 hover:text-cream hover:bg-forest-800 rounded-xl transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium text-ui">Back to Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-coral hover:text-coral-300 hover:bg-coral/10 rounded-xl transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-ui">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-forest-900/95 backdrop-blur-lg border-b border-forest-800 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-forest-400 hover:text-cream transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-display font-semibold text-cream text-sm">Admin</span>
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
