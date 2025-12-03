import type { Metadata, Viewport } from 'next'
import { Inter, Exo_2 } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

// Body font - clean, readable, versatile
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

// Heading font - energetic, futuristic, dynamic
const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['600', '700', '800', '900'],
  variable: '--font-exo2',
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
  themeColor: '#080A0F',
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
      <body className={`${inter.variable} ${exo2.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
