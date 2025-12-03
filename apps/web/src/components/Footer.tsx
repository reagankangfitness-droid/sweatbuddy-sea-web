'use client'

import { Logo } from './logo'
import { Instagram, Twitter, Mail } from 'lucide-react'

const footerLinks = [
  {
    title: 'Discover',
    links: [
      { label: 'Events', href: '#events' },
      { label: 'Cities', href: '#cities' },
      { label: 'Categories', href: '#events' },
    ],
  },
  {
    title: 'Organizers',
    links: [
      { label: 'Submit Event', href: '#submit' },
      { label: 'Guidelines', href: '#' },
      { label: 'Partner With Us', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#mission' },
      { label: 'Contact', href: 'mailto:hello@sweatbuddies.com' },
      { label: 'Privacy', href: '#' },
    ],
  },
]

const socialLinks = [
  { icon: Instagram, href: 'https://instagram.com/foundersrc', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/foundersrc', label: 'Twitter' },
  { icon: Mail, href: 'mailto:hello@sweatbuddies.com', label: 'Email' },
]

export function Footer() {
  return (
    <footer className="relative pt-20 pb-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#080A0F]" />

      {/* Top gradient border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 max-w-container mx-auto px-6 lg:px-10">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-16">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 text-white mb-4">
              <Logo size={32} />
              <span className="font-bold text-xl">sweatbuddies</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              Your city&apos;s moving. Know where.
            </p>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-[#3CCFBB] hover:border-[#3CCFBB]/30 transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="font-semibold text-white text-sm mb-4 uppercase tracking-wider">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-white/40 text-sm hover:text-white transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/30 text-sm">
              © {new Date().getFullYear()} SweatBuddies. All events listed are open to attend.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-white/30 text-sm hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-white/30 text-sm hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Large background text */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none overflow-hidden">
          <div
            className="text-[15vw] font-extrabold text-white/[0.02] whitespace-nowrap"
            style={{ letterSpacing: '-0.05em' }}
          >
            SWEAT
          </div>
        </div>
      </div>
    </footer>
  )
}
