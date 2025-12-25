export interface Activity {
  id: string
  title: string
  description?: string | null
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city: string
  address?: string | null
  latitude: number
  longitude: number
  startTime?: Date | null
  endTime?: Date | null
  maxPeople?: number | null
  imageUrl?: string | null
  // Pricing fields
  isFree: boolean
  price: number
  currency: string
  // PayNow payment fields
  paynowEnabled: boolean
  paynowNumber?: string | null
  paynowName?: string | null
  paynowQrCode?: string | null
  // Stripe payment fields
  stripeEnabled: boolean
  stripePriceId?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
  userId: string
  hostId?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreateActivityDto {
  title: string
  description?: string
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city: string
  address?: string
  latitude: number
  longitude: number
  startTime?: Date
  endTime?: Date
  maxPeople?: number
  imageUrl?: string
  // Pricing fields
  isFree?: boolean
  price?: number
  currency?: string
  // PayNow fields
  paynowEnabled?: boolean
  paynowNumber?: string
  paynowName?: string
  paynowQrCode?: string
  // Stripe fields
  stripeEnabled?: boolean
  stripePriceId?: string
}

export interface UpdateActivityDto {
  title?: string
  description?: string
  type?: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  city?: string
  address?: string
  latitude?: number
  longitude?: number
  startTime?: Date
  endTime?: Date
  maxPeople?: number
  imageUrl?: string
  // Pricing fields
  isFree?: boolean
  price?: number
  currency?: string
  // PayNow fields
  paynowEnabled?: boolean
  paynowNumber?: string
  paynowName?: string
  paynowQrCode?: string
  // Stripe fields
  stripeEnabled?: boolean
  stripePriceId?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
}
