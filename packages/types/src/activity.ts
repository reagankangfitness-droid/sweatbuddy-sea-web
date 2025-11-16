export interface Activity {
  id: string
  name: string
  description?: string | null
  duration: number
  calories?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateActivityDto {
  name: string
  description?: string
  duration: number
  calories?: number
}

export interface UpdateActivityDto {
  name?: string
  description?: string
  duration?: number
  calories?: number
}
