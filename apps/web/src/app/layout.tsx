import type { Metadata, Viewport } from 'next'
import type { PropsWithChildren } from 'react'
import { Barlow_Condensed, Geist, Geist_Mono } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'
import 'maplibre-gl/dist/maplibre-gl.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
  preload: true,
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
})

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-barlow',
  display: 'swap',
})

const BASE_URL = 'https://www.sweatbuddies.co'
const SITE_TITLE = 'SweatBuddies | Social Fitness Events in Bangkok and Singapore'
const SITE_DESCRIPTION =
  'Find your people through fitness. Discover social runs, yoga, pickleball, strength, recovery, and wellness events across Bangkok and Singapore.'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | SweatBuddies',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Bangkok fitness sessions',
    'Singapore fitness sessions',
    'social fitness events',
    'local fitness communities',
    'run club',
    'yoga group',
    'pickleball crew',
    'strength training',
    'recovery sessions',
    'fitness events',
    'social fitness SEA',
  ],
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
        alt: 'SweatBuddies social fitness events in Bangkok and Singapore.',
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} font-sans antialiased bg-[#0D0D0D] text-[#FAFAFA]`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
