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
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
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
      <div className="min-h-screen bg-[#0A1628] flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl border border-white/20 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-white/60 mb-6">Please log in to access the admin dashboard.</p>
          <Link
            href="/admin/login"
            className="inline-block w-full bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A1628]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#0D1B2A] border-r border-white/10 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <span className="font-bold text-white">Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white"
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
                    ? 'bg-gradient-to-r from-[#2563EB] to-[#38BDF8] text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back to Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 bg-[#0D1B2A]/80 backdrop-blur-lg border-b border-white/10 lg:hidden">
          <div className="flex items-center justify-between px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-white/60 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-[#2563EB] to-[#38BDF8] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs">SB</span>
              </div>
              <span className="font-bold text-white text-sm">Admin</span>
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
