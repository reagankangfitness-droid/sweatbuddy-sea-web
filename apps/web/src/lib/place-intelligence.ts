import core from './place-intelligence-core'

export interface PlaceIntelligenceInput {
  name: string
  placeType?: string | null
  area?: string | null
  address?: string | null
  activities?: string[] | null
  amenities?: string[] | null
  vibeTags?: string[] | null
  communityTypes?: string[] | null
  websiteUrl?: string | null
  sourceProvider?: string | null
  googlePlaceId?: string | null
  googleRating?: number | string | null
  googleReviewCount?: number | null
  reviewCount?: number | null
  photos?: string[] | null
  mediaAssetCount?: number | null
  dropInFriendly?: boolean | null
  beginnerFriendly?: boolean | null
  socialScore?: number | null
}

export interface PlaceIntelligenceSummary {
  trustScore: number
  photoQualityScore: number
  reviewSentimentScore: number
  aiSummary: string
  aiPros: string[]
  aiCons: string[]
}

export const buildPlaceIntelligence = core.buildPlaceIntelligence as (
  place: PlaceIntelligenceInput,
) => PlaceIntelligenceSummary

export const calculatePlaceTrustScore = core.calculatePlaceTrustScore as (
  place: PlaceIntelligenceInput,
) => number

export const calculatePhotoQualityScore = core.calculatePhotoQualityScore as (
  place: PlaceIntelligenceInput,
) => number

export const calculateReviewSentimentScore = core.calculateReviewSentimentScore as (
  place: PlaceIntelligenceInput,
) => number
