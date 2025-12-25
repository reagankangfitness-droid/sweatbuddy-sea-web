import { useQuery } from '@tanstack/react-query'

export interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  address: string | null
  latitude: number
  longitude: number
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  imageUrl: string | null
  // Pricing fields
  isFree: boolean
  price: number
  currency: string
  // PayNow payment fields
  paynowEnabled: boolean
  paynowNumber: string | null
  paynowName: string | null
  paynowQrCode: string | null
  // Stripe payment fields
  stripeEnabled: boolean
  stripePriceId: string | null
  status: string
  hostId: string | null
  userId: string
  createdAt: string
  host: {
    id: string
    name: string | null
    imageUrl: string | null
  } | null
  user: {
    id: string
    name: string | null
    imageUrl: string | null
  }
  _count: {
    userActivities: number
  }
}

const API_URL = process.env.EXPO_PUBLIC_API_URL

export function useActivities() {
  return useQuery({
    queryKey: ['activities'],
    queryFn: async (): Promise<Activity[]> => {
      const response = await fetch(`${API_URL}/activities`)

      if (!response.ok) {
        throw new Error('Failed to fetch activities')
      }

      return response.json()
    },
  })
}
