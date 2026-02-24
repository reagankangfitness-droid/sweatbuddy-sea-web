import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'
import { Plus_Jakarta_Sans, Outfit, DM_Sans } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import { AppNav } from '@/components/AppNav'
import { PushPromptBanner } from '@/components/push-prompt-banner'
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

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const BASE_URL = 'https://www.sweatbuddies.co'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'SweatBuddies | Discover & Host Fitness Events in Your Community',
    template: '%s | SweatBuddies',
  },
  description: 'Find group workouts, run clubs, and wellness events near you — or create your own. SweatBuddies is where fitness communities come to life.',
  keywords: ['fitness experiences', 'Singapore', 'run club', 'yoga', 'bootcamp', 'outdoor fitness', 'community experiences', 'workout', 'HIIT', 'group fitness'],
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
    title: 'SweatBuddies | Discover & Host Fitness Events in Your Community',
    description: 'Find group workouts, run clubs, and wellness events near you — or create your own. SweatBuddies is where fitness communities come to life.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies — Discover & host fitness events in your community.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SweatBuddies | Discover & Host Fitness Events in Your Community',
    description: 'Find group workouts, run clubs, and wellness events near you — or create your own. SweatBuddies is where fitness communities come to life.',
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

        {/* Prefetch events API for faster data loading */}
        <link rel="prefetch" href="/api/events" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${dmSans.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
          <AppNav />
          <PushPromptBanner />
        </Providers>
      </body>
    </html>
  )
}
