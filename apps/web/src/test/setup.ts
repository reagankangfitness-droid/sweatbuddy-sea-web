import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Google Maps
const mockGoogleMaps = {
  Map: vi.fn(),
  Marker: vi.fn(),
  places: {
    Autocomplete: vi.fn(),
    PlacesService: vi.fn(),
  },
  LatLng: vi.fn((lat, lng) => ({ lat, lng })),
  LatLngBounds: vi.fn(),
}

global.google = {
  maps: mockGoogleMaps as any,
}

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
