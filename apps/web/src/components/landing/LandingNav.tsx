import Link from 'next/link'
import { LogoWithText } from '@/components/logo'

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-sm border-b border-neutral-100">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <LogoWithText size={24} />
        </Link>

        {/* Right: Nav links + Sign in */}
        <div className="flex items-center gap-5">
          <Link
            href="/events"
            className="hidden sm:inline text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Events
          </Link>
          <Link
            href="#host"
            className="hidden sm:inline text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Host
          </Link>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-md hover:bg-neutral-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}
