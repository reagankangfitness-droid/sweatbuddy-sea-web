import Link from 'next/link'
import { LogoWithText } from '@/components/logo'

export function LandingNav() {
  return (
    <nav className="fixed top-0 w-full z-50 px-4 sm:px-8 py-4 backdrop-blur-xl bg-[#0A0E1A]/80 border-b border-white/[0.06] flex justify-between items-center transition-all duration-300">
      <Link href="/" className="flex items-center gap-2">
        <LogoWithText size={28} variant="white" />
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/sign-in"
          className="text-gray-300 font-[family-name:var(--font-outfit)] font-medium text-sm transition-colors duration-200 hover:text-white"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="bg-brand-blue text-white border-none px-6 py-2.5 rounded-full font-[family-name:var(--font-outfit)] font-semibold text-sm transition-all duration-300 hover:bg-brand-blue-dark hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,37,204,0.4)]"
        >
          Get Started
        </Link>
      </div>
    </nav>
  )
}
