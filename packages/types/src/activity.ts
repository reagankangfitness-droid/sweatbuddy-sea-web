export interface Activity {
  id: string
  title: string
  description?: string | null
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  categorySlug?: string | null
  city: string
  address?: string | null
  streetAddress?: string | null
  postalCode?: string | null
  country?: string | null
  placeId?: string | null
  neighborhoodId?: string | null
  latitude: number
  longitude: number
  startTime?: Date | null
  endTime?: Date | null
  maxPeople?: number | null
  imageUrl?: string | null
  price: number
  currency: string
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  userId: string
  hostId?: string | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  activityMode: 'MARKETPLACE' | 'P2P_FREE' | 'P2P_PAID'
  sessionType?: 'COACH_LED' | 'COMMUNITY' | null
  cancellationPolicy?: string | null
  sessionTemplateId?: string | null
  fitnessLevel?: string | null
  whatToBring?: string | null
  requiresApproval: boolean
  isFeatured: boolean
  acceptPayNow: boolean
  acceptStripe: boolean
  paynowQrImageUrl?: string | null
  paynowPhoneNumber?: string | null
  paynowName?: string | null
  requiresDeposit: boolean
  depositAmount?: number | null
  isRecurring: boolean
  recurrenceDay?: string | null
  recurrenceEndDate?: Date | null
  communityId?: string | null
}

export interface CreateActivityDto {
  title: string
  description?: string
  type: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  categorySlug?: string
  city: string
  address?: string
  streetAddress?: string
  postalCode?: string
  country?: string
  placeId?: string
  neighborhoodId?: string
  latitude: number
  longitude: number
  startTime?: Date
  endTime?: Date
  maxPeople?: number
  imageUrl?: string
  price?: number
  currency?: string
  activityMode?: 'MARKETPLACE' | 'P2P_FREE' | 'P2P_PAID'
  sessionType?: 'COACH_LED' | 'COMMUNITY'
  cancellationPolicy?: string
  sessionTemplateId?: string
  fitnessLevel?: string
  whatToBring?: string
  requiresApproval?: boolean
  isFeatured?: boolean
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string
  paynowPhoneNumber?: string
  paynowName?: string
  requiresDeposit?: boolean
  depositAmount?: number
  isRecurring?: boolean
  recurrenceDay?: string
  recurrenceEndDate?: Date
  communityId?: string
}

export interface UpdateActivityDto {
  title?: string
  description?: string
  type?: 'RUN' | 'GYM' | 'YOGA' | 'HIKE' | 'CYCLING' | 'OTHER'
  categorySlug?: string
  city?: string
  address?: string
  streetAddress?: string
  postalCode?: string
  country?: string
  placeId?: string
  neighborhoodId?: string
  latitude?: number
  longitude?: number
  startTime?: Date
  endTime?: Date
  maxPeople?: number
  imageUrl?: string
  price?: number
  currency?: string
  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'
  activityMode?: 'MARKETPLACE' | 'P2P_FREE' | 'P2P_PAID'
  sessionType?: 'COACH_LED' | 'COMMUNITY'
  cancellationPolicy?: string
  sessionTemplateId?: string
  fitnessLevel?: string
  whatToBring?: string
  requiresApproval?: boolean
  isFeatured?: boolean
  acceptPayNow?: boolean
  acceptStripe?: boolean
  paynowQrImageUrl?: string
  paynowPhoneNumber?: string
  paynowName?: string
  requiresDeposit?: boolean
  depositAmount?: number
  isRecurring?: boolean
  recurrenceDay?: string
  recurrenceEndDate?: Date
  communityId?: string
}
