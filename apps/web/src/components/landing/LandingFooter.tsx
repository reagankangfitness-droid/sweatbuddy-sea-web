import Link from 'next/link'
import { LogoWithText } from '@/components/logo'

export function LandingFooter() {
  return (
    <footer className="py-10 px-5 border-t border-neutral-800 bg-neutral-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <LogoWithText size={24} />
          </Link>
          <nav className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-sm text-neutral-500">
            <Link href="/events" className="hover:text-neutral-100 transition-colors">Events</Link>
            <Link href="/communities" className="hover:text-neutral-100 transition-colors">Communities</Link>
            <Link href="/host" className="hover:text-neutral-100 transition-colors">Host</Link>
            <Link href="/support" className="hover:text-neutral-100 transition-colors">Support</Link>
          </nav>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-6 text-xs text-neutral-400">
          <span>Made in Singapore {'\u{1F1F8}\u{1F1EC}'}</span>
          <a
            href="https://instagram.com/_sweatbuddies"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-400 transition-colors"
          >
            @_sweatbuddies
          </a>
        </div>
      </div>
    </footer>
  )
}
