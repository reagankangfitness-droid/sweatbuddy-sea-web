import type { Metadata } from 'next'
import { Inter, League_Spartan } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const leagueSpartan = League_Spartan({
  subsets: ['latin'],
  variable: '--font-league-spartan',
})

export const metadata: Metadata = {
  title: 'sweatbuddies',
  description: 'Find a workout experience near you',
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to Clerk to speed up auth */}
        <link rel="preconnect" href="https://clerk.sweatbuddies.co" />
        <link rel="dns-prefetch" href="https://clerk.sweatbuddies.co" />
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
