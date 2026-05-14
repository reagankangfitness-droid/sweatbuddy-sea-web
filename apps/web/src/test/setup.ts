import { vi } from 'vitest'

interface MockGoogleMaps {
  Map: ReturnType<typeof vi.fn>
  Marker: ReturnType<typeof vi.fn>
  places: {
    Autocomplete: ReturnType<typeof vi.fn>
    PlacesService: ReturnType<typeof vi.fn>
  }
  LatLng: ReturnType<typeof vi.fn>
  LatLngBounds: ReturnType<typeof vi.fn>
}

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

globalThis.google = {
  maps: mockGoogleMaps,
} as unknown as typeof google

// Mock environment variables
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001'
