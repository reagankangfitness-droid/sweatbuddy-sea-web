import type { Metadata } from 'next'
import { Inter, League_Spartan } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
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
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.variable} ${leagueSpartan.variable}`}>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
