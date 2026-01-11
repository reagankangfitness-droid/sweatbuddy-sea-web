import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { BottomNav } from '@/components/BottomNav'
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
    default: 'SweatBuddies | Find Fitness Events in Singapore',
    template: '%s | SweatBuddies',
  },
  description: 'Show up alone. Leave with a crew. Find run clubs, yoga, HIIT and fitness events across Singapore. No membership required.',
  keywords: ['fitness events', 'Singapore', 'run club', 'yoga', 'bootcamp', 'outdoor fitness', 'community events', 'workout', 'HIIT', 'group fitness'],
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
    title: 'SweatBuddies | Find Fitness Events in Singapore',
    description: 'Show up alone. Leave with a crew. Find run clubs, yoga, HIIT and fitness events across Singapore.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies — Show up alone. Leave with a crew.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SweatBuddies | Find Fitness Events in Singapore',
    description: 'Show up alone. Leave with a crew. Find fitness events across Singapore.',
    images: ['/images/og-image.jpg'],
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
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // For iOS notch/safe areas
}

export default function RootLayout({ children }: PropsWithChildren) {
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
          <BottomNav />
        </Providers>
      </body>
    </html>
  )
}
