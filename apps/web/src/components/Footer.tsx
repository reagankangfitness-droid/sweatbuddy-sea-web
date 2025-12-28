import { Logo } from '@/components/logo'
import { Instagram, Mail, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-150">
      <div className="max-w-content mx-auto px-6 lg:px-10 py-20">
        <div className="grid md:grid-cols-3 gap-16 md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <Logo size={28} />
              <span className="font-semibold text-lg text-neutral-900" style={{ letterSpacing: '-0.02em' }}>
                sweatbuddies
              </span>
            </div>
            <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
              Find your workout. Just show up.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-5 text-sm">Quick Links</h4>
            <nav className="flex flex-col gap-3.5">
              <a href="#events" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                Browse Events
              </a>
              <a href="/my-events" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                My Events
              </a>
              <a href="#mission" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                About Us
              </a>
              <a href="/organizer" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                Host Login
              </a>
              <a href="/privacy" className="text-neutral-500 hover:text-neutral-900 transition-colors text-sm">
                Privacy Policy
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-neutral-900 mb-5 text-sm">Connect</h4>
            <div className="flex flex-col gap-3.5">
              <a
                href="https://instagram.com/_sweatbuddies"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm"
              >
                <Instagram className="w-4 h-4" />
                @_sweatbuddies
                <ArrowUpRight className="w-3 h-3 opacity-50" />
              </a>
              <a
                href="mailto:hello@sweatbuddies.co"
                className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                hello@sweatbuddies.co
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar - subtle divider */}
        <div className="mt-16 pt-8 border-t border-neutral-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} SweatBuddies. Made with 💪 for the community.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400">Built for the community</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
