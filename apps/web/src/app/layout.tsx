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
    default: 'SweatBuddies | Find Verified Fitness & Sports Coaches Near You',
    template: '%s | SweatBuddies',
  },
  description: 'Find verified fitness and sports coaches near you. Browse sessions led by verified coaches — running, yoga, gym, hiking and more.',
  keywords: ['find a coach', 'personal trainer', 'sports coach', 'fitness coach', 'book a coach', 'verified coaches', 'group fitness', 'fitness events', 'run club', 'social fitness', 'fitness meetup', 'group workouts near me', 'fitness community'],
  authors: [{ name: 'SweatBuddies' }],
  creator: 'SweatBuddies',
  icons: {
    icon: '/favicon.svg',
    apple: '/images/logo/favicon.svg',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en',
    url: BASE_URL,
    siteName: 'SweatBuddies',
    title: 'SweatBuddies | Find Verified Fitness & Sports Coaches Near You',
    description: 'Find verified fitness and sports coaches near you. Browse sessions led by verified coaches — running, yoga, gym, hiking and more.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies — Find verified fitness & sports coaches near you.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SweatBuddies | Find Verified Fitness & Sports Coaches Near You',
    description: 'Find verified fitness and sports coaches near you. Browse sessions led by verified coaches — running, yoga, gym, hiking and more.',
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
  themeColor: '#0A0A0A',
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

        {/* Prefetch activities API for faster data loading */}
        <link rel="prefetch" href="/api/activities" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${plusJakarta.variable} ${outfit.variable} ${dmSans.variable} font-sans antialiased bg-[#0A0A0A] text-neutral-100`}>
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
