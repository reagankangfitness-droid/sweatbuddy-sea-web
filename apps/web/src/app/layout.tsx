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
    default: 'SweatBuddies | Discover Fitness & Wellness Experiences',
    template: '%s | SweatBuddies',
  },
  description: 'Discover fitness and wellness experiences. Sunrise yoga, beach bootcamps, run clubs, cold plunge socials — whatever moves you.',
  keywords: ['sweat is better shared', 'fitness crew', 'run club', 'yoga group', 'workout community', 'find your crew', 'fitness belonging', 'group fitness', 'discover experiences', 'fitness experiences', 'wellness experiences'],
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
    title: 'SweatBuddies | Discover Fitness & Wellness Experiences',
    description: 'Discover fitness and wellness experiences. Sunrise yoga, beach bootcamps, run clubs, cold plunge socials — whatever moves you.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies — Sweat is better shared.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SweatBuddies | Discover Fitness & Wellness Experiences',
    description: 'Discover fitness and wellness experiences. Sunrise yoga, beach bootcamps, run clubs, cold plunge socials — whatever moves you.',
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
  themeColor: '#FFFBF8',
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
      <body className={`${plusJakarta.variable} ${outfit.variable} ${dmSans.variable} font-sans antialiased bg-[#FFFBF8] text-[#4A4A5A]`}>
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
