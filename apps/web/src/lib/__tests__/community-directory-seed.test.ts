import { describe, expect, it } from 'vitest'
import {
  getCommunitySeedBySlug,
  getPublicCommunitySeeds,
} from '@/lib/community-directory-seed'

describe('community directory publication gate', () => {
  it('publishes only the verified joinable seed shortlist', () => {
    expect(getPublicCommunitySeeds().map((community) => community.slug)).toEqual([
      'fast-and-free-running-club',
      'mr25',
      'fitfam-singapore',
      'yoga-for-a-change',
      'meditate-singapore',
      'anza-cycling',
      'five45-cycling-club',
    ])
  })

  it('does not expose research-queue seeds through detail lookup', () => {
    expect(getCommunitySeedBySlug('singapore-pickleball-meetup-group')).toBeNull()
    expect(getCommunitySeedBySlug('boulder-without-borders')).toBeNull()
    expect(getCommunitySeedBySlug('metasport')).toBeNull()
  })
})
