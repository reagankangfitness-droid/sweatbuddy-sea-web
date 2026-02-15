'use client'

interface Activity {
  id: string
  title: string
  description: string | null
  type: string
  city: string
  latitude: number
  longitude: number
  startTime: Date | null
  endTime: Date | null
  maxPeople: number | null
  imageUrl: string | null
  createdAt: Date
}

interface DashboardActivitiesProps {
  initialActivities: Activity[]
}

// Hidden: spontaneous activities UI is disabled in favor of hosted experiences
export function DashboardActivities(_props: DashboardActivitiesProps) {
  return null
}
