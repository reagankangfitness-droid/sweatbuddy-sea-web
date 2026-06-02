import type { CityLandingPageProps } from '@/components/landing/CityLandingPage'

export const singaporeLanding: CityLandingPageProps = {
  city: 'Singapore',
  citySlug: 'singapore',
  eyebrow: 'Social fitness in Singapore',
  title: 'Show up alone. Leave with familiar faces.',
  description:
    'Find solo-friendly run clubs, pickleball games, yoga groups, and social workouts in Singapore where people actually expect to meet.',
  heroImage: '/images/cities/singapore.jpg',
  heroAlt: 'Singapore skyline and local fitness communities',
  painIntro:
    'Skip the endless search through Instagram stories, Telegram chats, and word of mouth. Find sessions with enough context to show up alone.',
  painTitle: 'Moving here should not mean rebuilding your social life from zero.',
  painBody:
    'Singapore is efficient, polished, and busy. That does not make normal gyms social. SweatBuddies helps you find the rooms where conversation is expected.',
  routes: [
    { label: 'Run clubs', image: '/banner/running.jpg', note: 'Most repeatable' },
    { label: 'Yoga groups', image: '/images/hero-bg.jpg', note: 'Low-pressure community' },
    { label: 'Pickleball crews', image: '/images/community-bonds.jpg', note: 'Beginner-friendly play' },
  ],
  moments: [
    'You just moved here and your week is work, errands, and solo gym sessions.',
    'You want healthier plans than nightlife, but you do not want forced networking.',
    'You keep seeing communities on Instagram after the session already happened.',
    'You are ready to meet people, but you need a first-timer-friendly way in.',
  ],
  hostTitle: 'Be the crew newcomers find first.',
  hostBody:
    'People arriving in Singapore are actively looking for routine, trust, and friendly entry points. Make your session visible before they know anyone.',
  hostBenefits: [
    { label: 'Get found nearby', body: 'Show up when newcomers search for something to join this week.' },
    { label: 'Reduce repeat DMs', body: 'Answer first-timer questions once with a clear session page.' },
    { label: 'Build regulars', body: 'Turn solo first-timers into people who recognize your crew.' },
  ],
  finalTitle: 'Stop waiting for Singapore to introduce itself.',
  finalBody:
    'Pick one solo-friendly session. Show up once. Give yourself a real chance to see the same people again.',
}

export const bangkokLanding: CityLandingPageProps = {
  city: 'Bangkok',
  citySlug: 'bangkok',
  eyebrow: 'Social fitness in Bangkok',
  title: 'Stop finding your social life through buried group chats.',
  description:
    'Find solo-friendly social runs, pickleball games, yoga sessions, and fitness crews in Bangkok with clear hosts, times, locations, and first-timer context.',
  heroImage: '/images/cities/bangkok.jpg',
  heroAlt: 'Bangkok city energy and local social fitness communities',
  painIntro:
    'Bangkok has endless things happening, but discovery is fragmented across Instagram, LINE, WhatsApp, and friend-of-a-friend invites.',
  painTitle: 'Bangkok is full of people. That does not make it easy to find your people.',
  painBody:
    'The hard part is not finding something to do. It is knowing which crews welcome newcomers, where to go, and whether it is normal to arrive alone.',
  routes: [
    { label: 'Social runs', image: '/images/hero/run-club.jpg', note: 'Easy weekly rhythm' },
    { label: 'Pickleball games', image: '/images/community-bonds.jpg', note: 'Low-intimidation interaction' },
    { label: 'Yoga and recovery', image: '/images/hero/ice-bath.webp', note: 'Wellness without nightlife' },
  ],
  moments: [
    'You are new in town and your best options are buried in stories or private chats.',
    'You want plans that feel social without turning every night into drinks.',
    'You are here for a month, a year, or maybe longer, and need a real routine fast.',
    'You want to meet people who actually show up again next week.',
  ],
  hostTitle: 'Grow beyond Instagram, LINE, and word of mouth.',
  hostBody:
    'Bangkok newcomers and long-stay visitors are looking for crews before they know who to ask. SweatBuddies gives them a clearer way to find you and arrive prepared.',
  hostBenefits: [
    { label: 'Capture active demand', body: 'Reach people already searching for social fitness plans in Bangkok.' },
    { label: 'Set expectations once', body: 'Make level, location, price, and solo-friendly context obvious.' },
    { label: 'Convert visitors to regulars', body: 'Give first-timers a reason to return instead of disappearing after one session.' },
  ],
  finalTitle: 'Make Bangkok easier to enter.',
  finalBody:
    'Choose one crew, one session, and one reason to show up solo. Familiarity starts when you repeat.',
}
