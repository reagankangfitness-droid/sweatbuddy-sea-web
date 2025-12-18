import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

// Plus Jakarta Sans - closest free alternative to Airbnb Cereal
// Geometric, warm, modern, excellent legibility
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  preload: true,
})

const BASE_URL = 'https://www.sweatbuddies.co'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'SweatBuddies - Discover Fitness Events in Singapore',
    template: '%s | SweatBuddies',
  },
  description: 'Discover the best fitness events in Singapore. Run clubs, outdoor yoga, community bootcamps, and more—curated in one place.',
  keywords: ['fitness events', 'Singapore', 'run club', 'yoga', 'bootcamp', 'outdoor fitness', 'free events', 'workout'],
  authors: [{ name: 'SweatBuddies' }],
  creator: 'SweatBuddies',
  icons: {
    icon: '/favicon.svg',
    apple: '/images/logo/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_SG',
    url: BASE_URL,
    siteName: 'SweatBuddies',
    title: 'SweatBuddies - Discover Fitness Events in Singapore',
    description: 'Discover the best fitness events in Singapore. Run clubs, outdoor yoga, community bootcamps, and more—curated in one place.',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies - Free Fitness Events in Singapore',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SweatBuddies - Discover Fitness Events in Singapore',
    description: 'Discover the best fitness events in Singapore. Run clubs, outdoor yoga, community bootcamps, and more.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#0F172A',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to image CDN for faster image loading */}
        <link rel="preconnect" href="https://utfs.io" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://utfs.io" />

        {/* Preload hero image for LCP optimization */}
        <link
          rel="preload"
          href="/images/hero-1.webp"
          as="image"
          type="image/webp"
        />

        {/* Prefetch events API for faster data loading */}
        <link rel="prefetch" href="/api/events" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
