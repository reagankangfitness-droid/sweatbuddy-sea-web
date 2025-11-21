import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'

// Set environment variable before importing component
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'

import NewActivityPage from '../page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

// Mock Google Maps
jest.mock('@react-google-maps/api', () => ({
  LoadScript: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoogleMap: ({ onClick }: { onClick: (e: any) => void }) => (
    <div
      data-testid="google-map"
      onClick={() =>
        onClick({
          latLng: {
            lat: () => 13.7563,
            lng: () => 100.5018,
          },
        })
      }
    />
  ),
  Marker: () => <div data-testid="marker" />,
  Autocomplete: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock Header component
jest.mock('@/components/header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('NewActivityPage', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      back: jest.fn(),
    })

    // Mock environment variable
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = 'test-api-key'
  })

  it('should render the form with all required fields', () => {
    render(<NewActivityPage />)

    expect(screen.getByLabelText(/activity title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByText(/City/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/search for a city/i)).toBeInTheDocument()
  })

  it('should fill form and submit successfully', async () => {
    // Mock fetch for successful POST
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ id: 'activity-123', title: 'Test Activity' }),
      })
    ) as jest.Mock

    render(<NewActivityPage />)

    // Fill in the form
    const titleInput = screen.getByLabelText(/activity title/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const cityInput = screen.getByPlaceholderText(/search for a city/i)

    fireEvent.change(titleInput, { target: { value: 'Morning Run' } })
    fireEvent.change(descriptionInput, { target: { value: 'A great morning run in Bangkok' } })
    fireEvent.change(cityInput, { target: { value: 'Bangkok' } })

    // Click on map to set location
    const map = screen.getByTestId('google-map')
    fireEvent.click(map)

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /create activity/i })
    fireEvent.click(submitButton)

    // Verify confirmation dialog opens
    await waitFor(() => {
      expect(screen.getByText(/confirm activity creation/i)).toBeInTheDocument()
    })

    // Confirm submission
    const confirmButton = screen.getByRole('button', { name: /confirm/i })
    fireEvent.click(confirmButton)

    // Verify API call
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/activities',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      )
    })

    // Verify redirect to activity page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/activities/activity-123')
    })
  })

  it('should show error message when API call fails', async () => {
    // Mock fetch for failed POST
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to create activity' }),
      })
    ) as jest.Mock

    const { toast } = require('sonner')

    render(<NewActivityPage />)

    // Fill in minimal form data
    fireEvent.change(screen.getByLabelText(/activity title/i), {
      target: { value: 'Test Activity' },
    })
    fireEvent.change(screen.getByPlaceholderText(/search for a city/i), {
      target: { value: 'Bangkok' },
    })

    // Click map to set location
    fireEvent.click(screen.getByTestId('google-map'))

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /create activity/i }))

    // Confirm in dialog
    await waitFor(() => {
      expect(screen.getByText(/confirm activity creation/i)).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    // Verify error toast was called
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })

    // Verify no redirect occurred
    expect(mockPush).not.toHaveBeenCalled()
  })
})
