'use client'

import { PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { StripeConnectProvider } from '@/contexts/StripeConnectContext'

export function Providers({ children }: PropsWithChildren) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#0025CC',
          colorBackground: '#FFFFFF',
          colorText: '#171717',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary-hover text-primary-foreground',
          card: 'shadow-lg',
        },
      }}
    >
      <StripeConnectProvider>
        {children}
      </StripeConnectProvider>
    </ClerkProvider>
  )
}
