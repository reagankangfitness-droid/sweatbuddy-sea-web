import type { Metadata, Viewport } from 'next'
import { Inter, League_Spartan } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

// Optimized font loading with display swap to prevent FOIT
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: 'SweatBuddies - Discover Fitness Events in Singapore',
  description: 'Discover the best fitness events in Singapore. Run clubs, outdoor yoga, community bootcamps, and more—curated in one place.',
  icons: {
    icon: '/favicon.svg',
    apple: '/images/logo/favicon.svg',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: '#1A2B3C',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* TODO: Re-enable for marketplace phase (Year 2)
        <link rel="preconnect" href="https://clerk.sweatbuddies.co" />
        <link rel="preconnect" href="https://utfs.io" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://img.clerk.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://clerk.sweatbuddies.co" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        */}
      </head>
      <body className={`${inter.variable} ${leagueSpartan.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
