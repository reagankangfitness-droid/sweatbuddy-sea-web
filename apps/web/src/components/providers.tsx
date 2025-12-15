'use client'

import { ClerkProvider } from '@clerk/nextjs'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
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
      {children}
    </ClerkProvider>
  )
}
