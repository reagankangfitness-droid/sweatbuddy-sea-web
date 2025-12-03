'use client'

// TODO: Re-enable for marketplace phase (Year 2)
// - Clerk: user accounts, organizer dashboards
// - AuthLoading component for loading states

interface ProvidersProps {
  children: React.ReactNode
}

// Phase 1: Simple provider wrapper without auth
export function Providers({ children }: ProvidersProps) {
  return <>{children}</>
}

/*
// =============================================================================
// ORIGINAL CLERK PROVIDER - COMMENTED OUT FOR PHASE 1
// =============================================================================

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
      <AuthLoading>
        {children}
      </AuthLoading>
    </ClerkProvider>
  )
}
*/
