import Link from 'next/link'

export function LandingFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="py-8 px-5 border-t border-neutral-200 text-center bg-white">
      <p className="text-caption text-neutral-500">
        © {currentYear} SweatBuddies · Built with 💪 for fitness communities ·{' '}
        <Link href="/" className="text-neutral-900 hover:underline">
          sweatbuddies.co
        </Link>
      </p>
    </footer>
  )
}
