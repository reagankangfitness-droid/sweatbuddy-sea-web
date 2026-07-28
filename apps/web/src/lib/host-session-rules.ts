export const DEFAULT_HOST_LOCATION = {
  city: 'Singapore',
  address: 'Singapore',
  latitude: 1.3521,
  longitude: 103.8198,
} as const

export const TRUSTED_COMMUNITY_MANAGER_LEVELS = [
  'VERIFIED_MANAGER',
  'TRUSTED_MANAGER',
] as const

type PublishableCommunity = {
  isActive?: boolean
  moderationStatus?: string
  managerTrustLevel?: string
}

export function isTrustedCommunityManager(managerTrustLevel?: string | null) {
  return TRUSTED_COMMUNITY_MANAGER_LEVELS.some((level) => level === managerTrustLevel)
}

export function isPublishableManagedCommunity(community: PublishableCommunity) {
  return (
    community.isActive !== false &&
    community.moderationStatus === 'LIVE' &&
    isTrustedCommunityManager(community.managerTrustLevel)
  )
}

export function inferCityFromLocation(location: string) {
  const match = location.match(/Singapore|Bangkok|Kuala Lumpur|Jakarta|Manila|Ho Chi Minh/i)
  return match?.[0] ?? DEFAULT_HOST_LOCATION.city
}
