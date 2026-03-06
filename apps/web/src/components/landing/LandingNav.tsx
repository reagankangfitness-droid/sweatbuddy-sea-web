import Link from 'next/link'
import { LogoWithText } from '@/components/logo'

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-neutral-950/90 backdrop-blur-sm border-b border-neutral-800">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <LogoWithText size={24} />
        </Link>

        {/* Right: Nav links + Sign in */}
        <div className="flex items-center gap-5">
          <Link
            href="/events"
            className="hidden sm:inline text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            Events
          </Link>
          <Link
            href="#host"
            className="hidden sm:inline text-sm font-medium text-neutral-400 hover:text-neutral-100 transition-colors"
          >
            Host
          </Link>
          <Link
            href="/sign-in"
            className="px-4 py-2 bg-white text-neutral-900 text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </nav>
  )
}
