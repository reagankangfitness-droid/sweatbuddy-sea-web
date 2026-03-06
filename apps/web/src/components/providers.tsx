'use client'

import { PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { StripeConnectProvider } from '@/contexts/StripeConnectContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <ClerkProvider
        appearance={{
          variables: {
            colorPrimary: '#FFFFFF',
            colorBackground: '#0A0A0A',
            colorText: '#F5F5F5',
            colorTextSecondary: '#A3A3A3',
            colorInputBackground: '#171717',
            colorInputText: '#F5F5F5',
          },
          elements: {
            formButtonPrimary: 'bg-white hover:bg-neutral-200 text-neutral-900',
            card: 'shadow-lg',
          },
        }}
      >
        <StripeConnectProvider>
          {children}
        </StripeConnectProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
