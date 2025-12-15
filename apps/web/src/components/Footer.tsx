import { Logo } from '@/components/logo'
import { Instagram, Mail, ArrowUpRight } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-navy border-t-2 border-sand/20">
      <div className="max-w-container mx-auto px-6 lg:px-10 py-16">
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Logo size={28} />
              <span className="font-display font-semibold text-xl text-sand" style={{ letterSpacing: '-0.02em' }}>
                sweatbuddies
              </span>
            </div>
            <p className="text-sand/60 text-sm max-w-xs leading-relaxed">
              Find your crew. Sweat together. The best friendships start at 6am.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-display font-semibold text-sand mb-4">Quick Links</h4>
            <nav className="flex flex-col gap-3">
              <a href="#events" className="text-sand/60 hover:text-terracotta transition-colors text-sm flex items-center gap-1">
                Browse Events
              </a>
              <a href="#mission" className="text-sand/60 hover:text-terracotta transition-colors text-sm flex items-center gap-1">
                About Us
              </a>
              <a href="/organizer" className="text-sand/60 hover:text-terracotta transition-colors text-sm flex items-center gap-1">
                For Hosts
              </a>
              <a href="/privacy" className="text-sand/60 hover:text-terracotta transition-colors text-sm flex items-center gap-1">
                Privacy Policy
              </a>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-sand mb-4">Connect</h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/_sweatbuddies"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sand/60 hover:text-terracotta transition-colors text-sm"
              >
                <Instagram className="w-4 h-4" />
                @_sweatbuddies
                <ArrowUpRight className="w-3 h-3" />
              </a>
              <a
                href="mailto:hello@sweatbuddies.com"
                className="inline-flex items-center gap-2 text-sand/60 hover:text-terracotta transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                hello@sweatbuddies.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-sand/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-sand/40">
            © {new Date().getFullYear()} SweatBuddies. Made with 💪 in Singapore.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-sand/40">Built for the community</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
