import Link from 'next/link'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 px-5 border-t border-white/[0.06] text-center">
      <p className="text-[0.8rem] text-gray-400">
        © {currentYear} SweatBuddies · Built with 💪 for fitness entrepreneurs ·{' '}
        <Link href="/" className="text-brand-blue-glow hover:underline">
          sweatbuddies.co
        </Link>
      </p>
    </footer>
  )
}
