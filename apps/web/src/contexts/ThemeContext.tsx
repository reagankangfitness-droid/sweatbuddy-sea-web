'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'

interface ThemeContextType {
  theme: 'light'
  resolvedTheme: 'light'
  setTheme: (theme: string) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Light-only theme provider — ensures .dark class is never applied
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Remove .dark class on mount in case it was cached in localStorage
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme: 'light',
        resolvedTheme: 'light',
        setTheme: () => {},
        toggleTheme: () => {},
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
