import { describe, expect, it } from 'vitest'
import { getCategoryFallbackImage, resolveSessionMedia } from '@/lib/session-media'

const baseSession = {
  id: 'session-1',
  imageUrl: null,
  categorySlug: 'boxing',
  city: 'Singapore',
  address: '123 Gym Road, Singapore',
  latitude: 1.3,
  longitude: 103.8,
  community: null,
}

describe('session media resolver', () => {
  it('prefers host-uploaded session images', () => {
    const media = resolveSessionMedia({
      ...baseSession,
      imageUrl: 'https://example.com/session.jpg',
    })

    expect(media.resolvedImageUrl).toBe('https://example.com/session.jpg')
    expect(media.imageSourceType).toBe('SESSION_UPLOAD')
    expect(media.imageSourceLabel).toBe('Session photo')
  })

  it('uses approved activity media before place media', () => {
    const media = resolveSessionMedia(baseSession, {
      activityMedia: {
        id: 'media-activity',
        entityType: 'ACTIVITY',
        entityId: 'session-1',
        sourceType: 'REVIEW',
        imageUrl: 'https://example.com/activity.jpg',
        thumbnailUrl: null,
        sourceUrl: 'https://example.com/source',
        externalId: null,
        attributionName: 'Jane',
        attributionUrl: 'https://example.com/jane',
        license: null,
        width: null,
        height: null,
        dominantColor: null,
        priority: 10,
        status: 'LIVE',
        capturedAt: null,
        lastFetchedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      placeMedia: {
        id: 'media-place',
        entityType: 'FITNESS_PLACE',
        entityId: 'place-1',
        sourceType: 'PARTNER',
        imageUrl: 'https://example.com/place.jpg',
        thumbnailUrl: null,
        sourceUrl: null,
        externalId: null,
        attributionName: null,
        attributionUrl: null,
        license: null,
        width: null,
        height: null,
        dominantColor: null,
        priority: 5,
        status: 'LIVE',
        capturedAt: null,
        lastFetchedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(media.resolvedImageUrl).toBe('https://example.com/activity.jpg')
    expect(media.imageSourceType).toBe('ACTIVITY_MEDIA')
    expect(media.imageAttributionName).toBe('Jane')
  })

  it('uses linked place photos before community images', () => {
    const media = resolveSessionMedia(
      {
        ...baseSession,
        community: { coverImage: 'https://example.com/community.jpg' },
      },
      {
        fitnessPlace: {
          id: 'place-1',
          name: 'Spartans',
          address: '123 Gym Road',
          area: 'CBD',
          latitude: 1.3,
          longitude: 103.8,
          googlePlaceId: null,
          coverImage: 'https://example.com/cover.jpg',
          photos: ['https://example.com/photo.jpg'],
          sourceUrl: 'https://example.com/source',
        },
      },
    )

    expect(media.resolvedImageUrl).toBe('https://example.com/photo.jpg')
    expect(media.imageSourceType).toBe('PLACE_COVER')
    expect(media.imageSourceLabel).toBe('Venue photo')
  })

  it('labels Google place media distinctly', () => {
    const media = resolveSessionMedia(baseSession, {
      placeMedia: {
        id: 'media-google-place',
        entityType: 'FITNESS_PLACE',
        entityId: 'place-1',
        sourceType: 'GOOGLE_PLACE',
        imageUrl: '/api/place-photo?placeId=places%2Fabc&photoIndex=0',
        thumbnailUrl: null,
        sourceUrl: 'https://maps.google.com/?cid=123',
        externalId: 'places/abc:0',
        attributionName: 'Google user',
        attributionUrl: 'https://maps.google.com/',
        license: null,
        width: null,
        height: null,
        dominantColor: null,
        priority: 70,
        status: 'LIVE',
        capturedAt: null,
        lastFetchedAt: null,
        expiresAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    expect(media.resolvedImageUrl).toContain('/api/place-photo')
    expect(media.imageSourceType).toBe('GOOGLE_PLACE_PHOTO')
    expect(media.imageSourceLabel).toBe('Google venue photo')
    expect(media.imageAttributionName).toBe('Google user')
  })

  it('does not treat local fallback paths as uploaded session photos', () => {
    const media = resolveSessionMedia(
      {
        ...baseSession,
        imageUrl: '/banner/running.jpg',
      },
      {
        fitnessPlace: {
          id: 'place-1',
          name: 'Running Club Meet Point',
          address: '123 Gym Road',
          area: 'CBD',
          latitude: 1.3,
          longitude: 103.8,
          googlePlaceId: null,
          coverImage: '/images/cities/singapore.jpg',
          photos: [],
          sourceUrl: null,
        },
      },
    )

    expect(media.resolvedImageUrl).toBe('/images/cities/singapore.jpg')
    expect(media.imageSourceType).toBe('PLACE_COVER')
  })

  it('falls back to community cover and then category image', () => {
    const communityMedia = resolveSessionMedia({
      ...baseSession,
      community: { coverImage: 'https://example.com/community.jpg' },
    })
    const fallbackMedia = resolveSessionMedia(baseSession)

    expect(communityMedia.resolvedImageUrl).toBe('https://example.com/community.jpg')
    expect(communityMedia.imageSourceType).toBe('COMMUNITY_COVER')
    expect(fallbackMedia.resolvedImageUrl).toBe(getCategoryFallbackImage('boxing'))
    expect(fallbackMedia.imageSourceType).toBe('CATEGORY_FALLBACK')
  })
})
