'use client'

import { PropsWithChildren } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { AppNav } from '@/components/AppNav'
import { PushPromptBanner } from '@/components/push-prompt-banner'
import { StripeConnectProvider } from '@/contexts/StripeConnectContext'
import { ThemeProvider } from '@/contexts/ThemeContext'

const localPublicRoutes = ['/', '/browse', '/singapore', '/bangkok', '/new-to-singapore']

export function Providers({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const usingLiveClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_live_')
  const shouldBypassLocalLiveClerk =
    process.env.NODE_ENV === 'development' &&
    usingLiveClerkKey &&
    localPublicRoutes.includes(pathname)

  if (pathname === '/' || shouldBypassLocalLiveClerk) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

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
          <AppNav />
          <PushPromptBanner />
        </StripeConnectProvider>
      </ClerkProvider>
    </ThemeProvider>
  )
}
