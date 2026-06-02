import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'
import { Plus_Jakarta_Sans, Outfit, DM_Sans, Barlow_Condensed } from 'next/font/google'
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

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})

const BASE_URL = 'https://www.sweatbuddies.co'
const SITE_TITLE = 'SweatBuddies | The Gym Won’t Introduce You To Anyone'
const SITE_DESCRIPTION =
  'Find solo-friendly fitness crews in Singapore and Bangkok: run clubs, pickleball games, yoga groups, and social workouts where people actually expect to meet.'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | SweatBuddies',
  },
  description: SITE_DESCRIPTION,
  keywords: ['new to Singapore', 'new to Bangkok', 'find friends through fitness', 'local fitness sessions', 'fitness crew', 'run club', 'yoga group', 'pickleball crew', 'workout community', 'find your crew', 'fitness belonging', 'group fitness', 'social fitness SEA'],
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SweatBuddies — find your people through local fitness.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
  themeColor: '#0D0D0D',
  colorScheme: 'dark',
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
      <body className={`${plusJakarta.variable} ${outfit.variable} ${dmSans.variable} ${barlowCondensed.variable} font-sans antialiased bg-[#0D0D0D] text-[#FAFAFA]`}>
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
