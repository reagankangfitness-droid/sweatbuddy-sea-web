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
      'chill-pace-run-club',
      'offform',
      'founders-running-club-singapore',
      'runninghour',
      'singapore-frontrunners',
      'singapore-runners-club',
      'run-jpg',
      'urban-milers',
    ])
  })

  it('does not expose research-queue seeds through detail lookup', () => {
    expect(getCommunitySeedBySlug('singapore-pickleball-meetup-group')).toBeNull()
    expect(getCommunitySeedBySlug('boulder-without-borders')).toBeNull()
    expect(getCommunitySeedBySlug('metasport')).toBeNull()
    expect(getCommunitySeedBySlug('fitfam-singapore')).toBeNull()
  })
})
