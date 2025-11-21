import { useQuery } from '@tanstack/react-query'

export interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: string | null
  endTime: string | null
  maxPeople: number | null
  imageUrl: string | null
  price: number
  currency: string
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
