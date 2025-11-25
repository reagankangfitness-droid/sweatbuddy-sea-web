'use client'

import { ClerkProvider } from '@clerk/nextjs'
import { AuthLoading } from './auth-loading'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: '#FFD230',
          colorBackground: '#FFFFFF',
          colorText: '#222222',
        },
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary-hover text-foreground',
          card: 'shadow-lg',
        },
      }}
    >
      <AuthLoading>
        {children}
      </AuthLoading>
    </ClerkProvider>
  )
}
